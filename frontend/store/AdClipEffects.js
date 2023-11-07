import {getStorage, ref, uploadBytes} from 'firebase/storage';

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

  return store;
};

export default effects;
