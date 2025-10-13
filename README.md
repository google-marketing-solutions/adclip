# AdClip

## Solution Overview

AdClip leverages Google's state-of-the-art AI to help advertisers adopt short-form creatives. It uses three AI technologies:

- Generative AI to identify and trim the most important ideas from a video transcript.
- Video Intelligence to understand the video's content and context.
- Speech to Text to transcribe the video's audio.

AdClip uses these technologies to:

- Make short-form content that is short, fun, and easy to digest.
- Produce multiple versions of transcripts from the same videos, allowing advertisers to test different narratives for different types of campaigns.

## Deployment

1. Create a firebase project with your GCP: https://firebase.google.com/docs/web/setup?hl=en&authuser=0#create-project
1. In the project settings, generate a new *web* app configuration. This will give you a set of keys and configuration settings that you will need to add to your web app.

### Frontend Deployment

1. Install Node: https://nodejs.org/en/download
1. On a terminal, cd to */frontend/* folder and run `npm install`
1. Copy and rename *.env.example* to  *.env.local*. Fill up the variables from firebase project settings
1. Install firebase CLI: https://firebase.google.com/docs/cli#install_the_firebase_cli
1. Run `firebase use <project_id>`. Replace <project_id> with the firebase project ID
1. Deploy the hosting: `firebase deploy --only hosting`

### Backend Deployment

1. Create a cloud storage bucket: https://firebase.google.com/docs/storage/web/start#create-default-bucket
1. Install python3.12: https://www.python.org/downloads/
1. Deploy the functions: `firebase deploy --only functions`
  a. If you encounter this error `Error: User code failed to load. Cannot determine backend specification`, just run the command again.

## Implementation

AdClip is a full-stack web application built on Google Cloud Platform (GCP). It offers a self-service UI that gives users a consistent and intuitive flow to generate short-form vertical and landscape videos from an existing long-form landscape video. To deploy AdClip, you would need access to a Google Cloud Project with the following product enabled: Vertex AI API, Firebase.

## Contact

- Team: Lan Tran, Ryan Sibbaluca
- Contributors: Quy Nguyen, Pankamol Srikaew, Maggie Ting
- Contact: <adclip-team@google.com>

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is not an officially supported Google product. It is an open source project licensed under the Apache 2.0 license and is not intended for production use.

This project follows [Google's Open Source Community Guidelines](https://opensource.google/conduct/).

Copyright Google LLC. All rights reserved.

