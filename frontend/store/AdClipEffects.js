import {getDownloadURL, getStorage, ref, uploadBytes} from 'firebase/storage';
import {createFirebaseApp} from '../firebase/clientApp';
import {callTranscribeVideo} from '../fetchData/cloudFunctions';
import {getFilenameFromFullPath} from '../fetchData/cloudStorage';

const INPUT_VIDEOS_FOLDER = 'videos/';

const effects = (store) => {
  store.on('selectedFilesForUpload').subscribe((files) => {
    for (const file of files) {
      const storageRef = ref(getStorage(), INPUT_VIDEOS_FOLDER + file.name);
      uploadBytes(storageRef, file).then((snapshot) => {
        const currentFiles = store.get('files');
        store.set('files')([...currentFiles, snapshot.metadata]);
        store.set('isFetchingFiles')(false);
      });
    }
  });

  store.on('isTranscribingVideo').subscribe((isTranscribingVideo) => {
    if (isTranscribingVideo) {
      const selectedVideoFullPath = store.get('selectedVideoFullPath');
      callTranscribeVideo({
        full_path: selectedVideoFullPath,
        file_name: getFilenameFromFullPath(selectedVideoFullPath),
      })
        .then((result) => {
          store.set('isTranscribingVideo')(false);
          store.set('reviewTranscripts')(result.data.transcript);
        })
        .catch((error) => {
          console.error(error);
          store.set('transcriptionError')(error);
        });
    }
  });

  store
    .on('isGettingOriginalVideoUrl')
    .subscribe((isGettingOriginalVideoUrl) => {
      if (isGettingOriginalVideoUrl) {
        const selectedVideoFullPath = store.get('selectedVideoFullPath');
        getDownloadURL(ref(getStorage(), selectedVideoFullPath)).then((url) => {
          store.set('isGettingOriginalVideoUrl')(false);
          store.set('reviewVideo')(url);
        });
      }
    });

  return store;
};

export default effects;
