import { config } from 'dotenv';
config();

import { createQueueService } from 'azure-storage';
import debounce from 'lodash.debounce';
import { getJob } from './services/job-service';
import { processJob } from './services/process-service';

const queueService = createQueueService();

queueService.createQueueIfNotExists(process.env['TRANSCODING_QUEUE'], (err) => {
  if (err) {
    console.log('[DEV] Failed connection to transcoding queue.');
    console.error(err);
    process.exit(1);
  }

  getJobFromQueue();
})


export const getJobFromQueue = debounce(() => {
  queueService.getMessages(process.env['TRANSCODING_QUEUE'], { numOfMessages: 1, visibilityTimeout: 1 * 60 }, async (err, [ result ], response) => {
    
    if (err) {
      console.error(err);
      return;
    }

    console.log(response);

    if (!result) {
      getJobFromQueue();
      return;
    }

    const id = result.messageText;
    const job = await getJob(id);
    await processJob(job);

    // When all the process is complete, wait for another job.
    getJobFromQueue()
  })
}, 2500)