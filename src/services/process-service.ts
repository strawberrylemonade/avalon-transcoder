import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { file } from 'tmp';
import got from 'got';
import { writeFile } from 'fs-extra';

import { IMedia, IJob, JobType, RecordingMode } from './job-service'

export const processJob = async (job: IJob) => {
  
  console.log('Processing Job...');
  switch (job.type) {
    case (JobType.Mobile):
      return await processMobile(job);
    case (JobType.Desktop):
      return await processDesktop(job);
    default:
      break;
  }
}

const processMobile = async (job: IJob) => {
  const media = job.media;
  const normalisedMedia = await Promise.all(media.map(m => normalise(m))) as IMedia[];
  const finalPath = await concatenate(normalisedMedia)
  return finalPath;
}

const processDesktop = async (job: IJob) => {
  const [media] = job.media;
  const normalisedMedia = await normalise(media) as IMedia;
  return normalisedMedia.normalisedPath;
}

const downloadMedia = async (media: IMedia): Promise<IMedia> => {
  return new Promise((resolve, reject) => {
    file({ postfix: '.mp4' }, async (err, path) => {
      if (err) reject(err);
    
      const response = await got(media.uploadedUrl)
        .on('downloadProgress', progress => {
          console.log(progress);
        })

      await writeFile(path, response.rawBody);
      media.localPath = path;
      resolve(media);
    });
  });
}

const normalise = (media: IMedia) => {
  return new Promise(async (resolve, reject) => {
    media = await downloadMedia(media);
    const command = ffmpeg(media.localPath)    
    configureNormaliseForMedia(command, media);
    command.output(media.localPath.replace('.mp4', 'normalised.mp4'))
    command.videoCodec('png')
    command.addOutputOption('-q:v 0')
    command.setDuration(formatDuration(media.duration))
    command.on('start', command => console.log(`Started normalising w/ "${command}"`))
    command.on('progress', progress => console.log(progress))
    command.on('error', (err) => reject(err))
    command.on('end', () => {
      media.normalisedPath = media.localPath.replace('.mp4', 'normalised.mp4');
      resolve(media);
    })
    command.run();
  })
}

const configureNormaliseForMedia = (command: FfmpegCommand, media: IMedia) => {
  switch (media.mode) {
    case RecordingMode.PiP:
      command.input('color=color=black@0.0:size=1280x720,format=rgba')
      command.addInputOption('-f lavfi')  
      command.complexFilter('[0]scale=iw/3:ih/3 [pip]; [1][pip] overlay=0:0')
      return;
    
    case RecordingMode.Screen:
      command.input('color=color=black@0.0:size=1280x720,format=rgba')
      command.addInputOption('-f lavfi')  
      command.complexFilter('[0]scale=1:1 [pip]; [1][pip] overlay=0:0')
      return;

    case RecordingMode.Facecam:
      command.videoFilter('scale=1280:720,format=rgba');
      return;
  }
}

const concatenate = (media: IMedia[]) => {
  return new Promise(async (resolve, reject) => {
    file({ postfix: '.mp4' }, async (err, path) => {
      if (err) reject(err);
      const command = ffmpeg();
      media.forEach(m => command.input(m.normalisedPath));
      command.complexFilter(`${media.reduce((c, a, i) => `${c}[${i}:v:0][${i}:a:0]`,'')}concat=n=${media.length}:v=1:a=1[outv][outa]`)
      command.videoCodec('png')
      command.addOutputOption('-q:v 0')
      command.map('[outv]');
      command.map('[outa]');
      command.output(path);
      command.on('start', command => console.log(`Started concatenating w/ "${command}"`))
      command.on('progress', progress => console.log(progress))
      command.on('error', (err) => reject(err))
      command.on('end', () => {
        resolve(path);
        resolve(media);
      })
      command.run();
    });
  })
}

const formatDuration = (duration: number) => {
  const seconds = Math.floor(duration / 1000)
  const milliseconds = duration % 1000;

  return `00:00:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`
}