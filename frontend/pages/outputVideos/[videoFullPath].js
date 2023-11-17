import Head from 'next/head';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';

function OutputVideos() {
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;

  const filename = getFilenameFromFullPath(videoFullPath);

  return (
    <>
      <Head>
        <title>{filename}</title>
      </Head>

      <h2>Output Videos</h2>
      <p>Thank you for using AdClip!</p>
    </>
  );
}

export default OutputVideos;
