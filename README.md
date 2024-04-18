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

## Disclaimer

This is not an officially supported Google product.

Copyright 2023 Google LLC. This solution, including any related sample code or data, is made available on an “as is,” “as available,” and “with all faults” basis, solely for illustrative purposes, and without warranty or representation of any kind. This solution is experimental, unsupported and provided solely for your convenience. Your use of it is subject to your agreements with Google, as applicable, and may constitute a beta feature as defined under those agreements. To the extent that you make any data available to Google in connection with your use of the solution, you represent and warrant that you have all necessary and appropriate rights, consents and permissions to permit Google to use and process that data. By using any portion of this solution, you acknowledge, assume and accept all risks, known and unknown, associated with its usage, including with respect to your deployment of any portion of this solution in your systems, or usage in connection with your business, if at all.
