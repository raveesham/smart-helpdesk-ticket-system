pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds(); buildDiscarder(logRotator(numToKeepStr: '15')) }
  environment {
    FRONTEND_DIR = 'frontend'
    BACKEND_IMAGE = 'smart-helpdesk-backend'
    FRONTEND_IMAGE = 'smart-helpdesk-frontend'
    SONAR_PROJECT_KEY = 'smart-helpdesk'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Secret Scan') {
      steps { sh '''
        gitleaks detect --source . --no-banner --redact --exit-code 1
      ''' }
    }
    stage('Backend Validation') {
      steps { sh '''
        python3 -m venv .venv
        . .venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        python -m compileall -q api core db models schemas services main.py
        if [ -d tests ]; then pytest -q; else echo "No backend tests directory in upstream repository; compile validation completed."; fi
      ''' }
    }
    stage('Frontend Validation') {
      steps { dir("${FRONTEND_DIR}") { sh '''
        npm ci
        npm run lint
        npm run build
      ''' } }
    }
    stage('SonarQube Analysis') {
      steps { withSonarQubeEnv('SonarQube') { sh '''
        sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
          -Dsonar.projectName="Smart Helpdesk Ticket System" \
          -Dsonar.sources=api,core,db,models,schemas,services,main.py,frontend \
          -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/.venv/**,frontend/package-lock.json
      ''' } }
    }
    stage('Quality Gate') {
      steps { timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true } }
    }
    stage('OWASP Dependency-Check') {
      steps {
        dependencyCheck additionalArguments: '--scan . --format XML --format HTML --out reports/dependency-check', odcInstallation: 'Dependency-Check'
        dependencyCheckPublisher pattern: 'reports/dependency-check/*.xml', failedTotalHigh: 1, failedTotalCritical: 1
      }
    }
    stage('Trivy Filesystem Scan') {
      steps { sh 'trivy fs --config security/trivy.yaml --exit-code 1 --severity HIGH,CRITICAL .' }
    }
    stage('Build Docker Images') {
      steps { sh '''
        docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -f Dockerfile .
        docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -f frontend/Dockerfile frontend
      ''' }
    }
    stage('Trivy Image Scan') {
      steps { sh '''
        trivy image --config security/trivy.yaml --exit-code 1 --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${BUILD_NUMBER}
        trivy image --config security/trivy.yaml --exit-code 1 --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${BUILD_NUMBER}
      ''' }
    }
    stage('Push Images') {
      when { branch 'main' }
      steps { withCredentials([usernamePassword(credentialsId: 'registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')]) { sh '''
        echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin
        docker tag ${BACKEND_IMAGE}:${BUILD_NUMBER} "$REGISTRY_USER/${BACKEND_IMAGE}:${BUILD_NUMBER}"
        docker tag ${FRONTEND_IMAGE}:${BUILD_NUMBER} "$REGISTRY_USER/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
        docker push "$REGISTRY_USER/${BACKEND_IMAGE}:${BUILD_NUMBER}"
        docker push "$REGISTRY_USER/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
        docker logout
      ''' } }
    }
  }
  post {
    always { archiveArtifacts artifacts: 'reports/**/*,**/coverage.xml,**/lcov.info', allowEmptyArchive: true }
    success { echo 'CI security and build stages completed. Deploy separately using the Kubernetes/Helm instructions.' }
    failure { echo 'Pipeline failed. Review the first failing stage and correct it before deployment.' }
  }
}
