const formatDuration = (duration) => {
  const seconds = Math.floor(duration / 1000)
  const milliseconds = duration % 1000;

  return `00:00:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`
}

const files = [
  {
    id: '9DA9103F-945F-4E06-8ECC-3F6453F23773',
    type: 'Facecam',
    duration: 31230
  },
  {
    id: '7A8FFFF9-C0F8-4F50-82C3-B06AC20AE5D5',
    type: 'PiP',
    duration: 48645
  },
  {
    id: '1DC0E8F1-01B8-43B2-A0B0-BDC79F8E352F',
    type: 'Screen',
    duration: 26881
  },
  {
    id: 'CBF85BA4-76B0-421A-A092-616007D2A84C',
    type: 'Facecam',
    duration: 4114
  }
]
console.log('Generating commands...')

files.forEach((file, i) => {
  console.log(`\nFile: ${i}`);
  if (file.type === 'PiP') {
    console.log(`/Applications/ffmpeg -i ${file.id}.mp4 -f lavfi -i color=color=black@0.0:size=1280x720,format=rgba -filter_complex "[0]scale=iw/3:ih/3 [pip]; [1][pip] overlay=0:0" -c:v png -q:v 0 -t ${formatDuration(file.duration)} normalised/${file.id}.mp4`)
  }
  
  if (file.type === 'Screen') {
    console.log(`/Applications/ffmpeg -i ${file.id}.mp4 -f lavfi -i color=color=black@0.0:size=1280x720,format=rgba -filter_complex "[0]scale=1:1 [pip]; [1][pip] overlay=0:0" -c:v png -q:v 0 -t ${formatDuration(file.duration)} normalised/${file.id}.mp4`)
  }

  if (file.type === 'Facecam') {
    console.log(`/Applications/ffmpeg -i ${file.id}.mp4 -vf scale=1280:720,format=rgba -c:v png -q:v 0 normalised/${file.id}.mp4`)
  }
})

const command = `\n\n/Applications/ffmpeg ${files.reduce((c, i) => `${c}-i normalised/${i.id}.mp4 `,'')}-filter_complex "${files.reduce((c, a, i) => `${c}[${i}:v:0][${i}:a:0]`,'')}concat=n=${files.length}:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v png -q:v 25 output.mp4`
console.log(command);
