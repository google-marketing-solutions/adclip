# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Deployment script for cloud functions not supported by firebase.
# Run with .deploy_functions.sh


declare -a APIS=('cloudfunctions.googleapis.com'
                 'firestore.googleapis.com'
                 'aiplatform.googleapis.com'
                )

function deploy_cloud_function() {
  echo ">> Deploying transcribe_video Cloud Function"
  gcloud functions deploy transcribe_video \
    --gen2 \
    --project ${PROJECT} \
    --set-env-vars GCCLOUD_PROJECT=${PROJECT},BUCKET=${BUCKET} \
    --region us-central1 \
    --runtime python312 \
    --entry-point transcribe_video \
    --memory 4Gi \
    --cpu 2 \
    --source functions/transcribe_video/ \
    --timeout=600s \
    --trigger-http

  echo ">> Deploying cut_video Cloud Function"
  gcloud functions deploy cut_video \
    --gen2 \
    --project ${PROJECT} \
    --set-env-vars GCCLOUD_PROJECT=${PROJECT},BUCKET=${BUCKET} \
    --region us-central1 \
    --runtime python312 \
    --entry-point cut_video \
    --memory 4Gi \
    --cpu 2 \
    --source functions/cut_video/ \
    --timeout=600s \
    --trigger-http
}

function enable_apis() {
  for api in "${APIS[@]}"
  do
    echo ">> Enabling cloud service: $api"
    gcloud services enable "$api"
  done
}

function deploy() {
  echo "Setting project..."
  gcloud config set project ${PROJECT}

  echo "(Step 1) Enable APIs"
  enable_apis

  echo "(Final Step) Deploying cloud functions..."
  deploy_cloud_function
}


read -p "Enter a Cloud Project id: " PROJECT
read -p "Provide cloud storage bucket: " BUCKET

echo "* PROJECT ID: ${PROJECT}"
echo "* Cloud Storage bucket: ${BUCKET}"

deploy

echo "😄 DONE!"

