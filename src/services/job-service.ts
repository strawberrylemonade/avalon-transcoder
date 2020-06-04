import got from 'got';

export enum JobType {
  Mobile = 'Mobile',
  Desktop = 'Desktop'
}

export enum RecordingMode {
	PiP = "PiP",
	Facecam = "Facecam",
	Screen = "Screen"
}

export enum SourceType {
  Camera = 'Camera',
  Microphone = 'Microphone',
  Screen = 'Screen'
}

export interface ISource {
  id: string
  type: SourceType
  name: string
}

export interface IMedia {
  id: string
  localPath?: string
  normalisedPath?: string
  uploadedUrl: string
  source: ISource
  startTime: number
  endTime: number
  duration: number
  mode: RecordingMode
}

export interface IJob {
  id: string
  sessionId: string
  type: JobType
  media: IMedia[]
}

export const getJob = async (id: string) => {

  try {
    const response = await got(`${process.env['JOB_API_URL']}/jobs/${id}`, { headers: { 'X-API-Key': process.env['JOB_API_KEY'] } })
    return JSON.parse(response.body);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const updateJob = async (id: string, candidate: Partial<IJob>) => {
  try {
    const response = await got(`${process.env['JOB_API_URL']}/jobs/${id}`, { headers: { 'X-API-Key': process.env['JOB_API_KEY'] }, method: 'PUT', body: JSON.stringify(candidate) })
    return JSON.parse(response.body);
  } catch (e) {
    console.error(e);
    throw e;
  }
}