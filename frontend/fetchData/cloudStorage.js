import {getMetadata, getStorage, ref, listAll} from 'firebase/storage';
import {createFirebaseApp} from '../firebase/clientApp';

const INPUT_VIDEOS_FOLDER = 'videos/';
const OUTPUT_FOLDER_NAME = 'output';
const APP = createFirebaseApp();

const STORAGE = getStorage(APP);
const getFilesFromStorage = async () => {
  const listRef = ref(STORAGE, INPUT_VIDEOS_FOLDER);
  const files = [];

  const promises = [];
  const getFileDetails = async (ref) => {
    const res = await listAll(ref);
    promises.push(
      ...res.items.map((itemRef) =>
        getMetadata(itemRef).then((fileMetadata) => files.push(fileMetadata)),
      ),
    );
    for (const folderRef of res.prefixes) {
      if (folderRef.name !== OUTPUT_FOLDER_NAME)
        await getFileDetails(folderRef);
    }
  };
  await getFileDetails(listRef);
  await Promise.all(promises);
  console.log(files);
  return files;
};

export const getVideosFromStorage = async () => {
  const files = await getFilesFromStorage();
  return files.filter((file) => file.contentType.includes('video'));
};
