# AdClip

AdClip is an open-source solution that leverages Google's state-of-the-art AI to help advertisers adopt short-form creatives. With AdClip, you can automatically generate short, engaging videos from your existing long-form content.

## Table of Contents

- [Solution Overview](#solution-overview)
- [Implementation](#implementation)
- [Deployment](#deployment)
  - [Prerequisites](#prerequisites)
  - [Frontend Deployment](#frontend-deployment)
  - [Backend Deployment](#backend-deployment)
- [Contributing](#contributing)
- [Contact](#contact)
- [License](#license)
- [Disclaimer](#disclaimer)

## Solution Overview

AdClip helps you create compelling short-form video ads by:

- **Identifying key moments:** Using Generative AI, AdClip analyzes your video transcripts to find the most important ideas and trims the video accordingly.
- **Understanding video content:** It leverages the Video Intelligence API to understand the content and context of your videos.
- **Transcribing audio:** The Speech-to-Text API is used to accurately transcribe your video's audio.

This allows you to:

- Quickly generate short, fun, and easy-to-digest videos for your campaigns.
- Create multiple versions of video transcripts from the same source, enabling you to test different narratives.

## Implementation

AdClip is a full-stack web application built on the Google Cloud Platform (GCP). It provides a self-service user interface for generating short-form vertical and landscape videos from a single long-form landscape video.

To deploy and use AdClip, you will need a Google Cloud Project with the following APIs enabled:

- Vertex AI API
- Firebase

## Deployment

### Prerequisites

- A Firebase project linked to your GCP account. You can create one [here](https://firebase.google.com/docs/web/setup?hl=en&authuser=0#create-project).
- A Cloud Storage bucket. You can create one [here](https://firebase.google.com/docs/storage/web/start#create-default-bucket).
- [Node.js](https://nodejs.org/en/download) installed.
- [Python 3.12](https://www.python.org/downloads/) installed.
- The [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) installed.

### Frontend Deployment

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install the required Node.js packages: `npm install`
3.  In your Firebase project settings, generate a new web app configuration.
4.  Copy the `.env.example` file to a new file named `.env.local`.
5.  Fill in the variables in `.env.local` with the configuration keys from your Firebase web app.
6.  Set your active Firebase project: `firebase use <project_id>` (replace `<project_id>` with your Firebase project ID).
7.  Deploy the frontend: `firebase deploy --only hosting`

### Backend Deployment

1.  Deploy the Cloud Functions: `firebase deploy --only functions`
    - If you encounter an error like `Error: User code failed to load. Cannot determine backend specification`, running the command again usually resolves the issue.

## Contributing

We welcome contributions to AdClip! Please see our [contributing guidelines](docs/contributing.md) and [code of conduct](docs/code-of-conduct.md) for more information.

## Contact

- **Team:** Lan Tran, Ryan Sibbaluca
- **Contributors:** Quy Nguyen, Pankamol Srikaew, Maggie Ting
- **Contact:** <adclip-team@google.com>

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is not an officially supported Google product. It is an open source project licensed under the Apache 2.0 license and is not intended for production use.

This project follows [Google's Open Source Community Guidelines](https://opensource.google/conduct/).

Copyright Google LLC. All rights reserved.
