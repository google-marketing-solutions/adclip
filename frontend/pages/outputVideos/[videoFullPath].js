import Head from 'next/head';
import {useRouter} from 'next/router';
import {getFilenameFromFullPath} from '../../fetchData/cloudStorage';
import Store from '../../store/AdClipStore';
import Button from '../../components/Button';
import Video from '../../components/Video';

function OutputVideos() {
  const store = Store.useStore();
  const router = useRouter();
  const videoFullPath = router.query.videoFullPath;
  const isGeneratingVideos = store.get('isGeneratingVideos');

  const filename = getFilenameFromFullPath(videoFullPath);

  const goToHomePage = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>{filename}</title>
      </Head>

      <h2>Output Videos</h2>
      <p>Thank you for using AdClip!</p>
      {isGeneratingVideos && (
        <div className="loadingEllipsis">Generating video</div>
      )}

      <div style={{width: '480px'}}>
        <Video isLoading={isGeneratingVideos} name={filename} />
      </div>

      <div style={{marginTop: '2rem'}}>
        <Button onClick={goToHomePage}>Start Over</Button>
      </div>
    </>
  );
}

export default OutputVideos;
