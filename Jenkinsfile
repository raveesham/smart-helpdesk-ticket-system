
pipeline {
    agent any

    options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    parameters {
        booleanParam(
            name: 'RUN_SONAR',
            defaultValue: false,
            description: 'Enable after SonarQube server and SonarScanner are configured in Jenkins.'
        )
        booleanParam(
            name: 'RUN_DEPENDENCY_CHECK',
            defaultValue: false,
            description: 'Enable after OWASP Dependency-Check tool is configured in Jenkins.'
        )
        booleanParam(
            name: 'PUSH_IMAGES',
            defaultValue: false,
            description: 'Push Docker images after configuring registry-credentials in Jenkins.'
        )
    }

    environment {
        FRONTEND_DIR = 'frontend'
        BACKEND_IMAGE = 'smart-helpdesk-backend'
        FRONTEND_IMAGE = 'smart-helpdesk-frontend'
        SONAR_PROJECT_KEY = 'smart-helpdesk'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Secret Scan - Gitleaks') {
            steps {
                powershell '''
                    Write-Host "Starting Gitleaks secret scan..."

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/repo" `
                        zricethezav/gitleaks:latest `
                        detect --source /repo --no-banner --redact --exit-code 1

                    if ($LASTEXITCODE -ne 0) {
                        throw "Gitleaks detected secrets or the scan failed."
                    }

                    Write-Host "Gitleaks scan completed successfully."
                '''
            }
        }

        stage('Backend Validation') {
            steps {
                powershell '''
                    Write-Host "Starting backend validation..."

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/workspace" `
                        -w /workspace `
                        python:3.12-slim `
                        sh -c 'python -m pip install --no-cache-dir -r requirements.txt && python -m compileall -q api core db models schemas services main.py && if [ -d tests ]; then python -m pip install pytest && pytest -q; else echo "No tests directory; compile validation completed."; fi'

                    if ($LASTEXITCODE -ne 0) {
                        throw "Backend validation failed."
                    }

                    Write-Host "Backend validation completed."
                '''
            }
        }

        stage('Frontend Validation') {
            steps {
                powershell '''
                    Write-Host "Starting frontend validation..."

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/workspace" `
                        -w /workspace/frontend `
                        node:22-alpine `
                        sh -c 'npm ci && npm run lint && npm run build'

                    if ($LASTEXITCODE -ne 0) {
                        throw "Frontend validation failed."
                    }

                    Write-Host "Frontend validation completed."
                '''
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { return params.RUN_SONAR }
            }
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube') {
                        powershell """
                            Write-Host "Starting SonarQube analysis..."

                            & "${scannerHome}\\bin\\sonar-scanner.bat" `
                                "-Dsonar.projectKey=${SONAR_PROJECT_KEY}" `
                                "-Dsonar.projectName=Smart Helpdesk Ticket System" `
                                "-Dsonar.sources=api,core,db,models,schemas,services,main.py,frontend" `
                                "-Dsonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/.venv/**,frontend/package-lock.json"

                            if (\\$LASTEXITCODE -ne 0) {
                                throw "SonarQube analysis failed."
                            }
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            when {
                expression { return params.RUN_SONAR }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('OWASP Dependency-Check') {
            when {
                expression { return params.RUN_DEPENDENCY_CHECK }
            }
            steps {
                script {
                    powershell 'New-Item -ItemType Directory -Force reports | Out-Null'

                    dependencyCheck(
                        additionalArguments: '--scan . --format XML --format HTML --out reports/dependency-check',
                        odcInstallation: 'Dependency-Check'
                    )

                    dependencyCheckPublisher(
                        pattern: 'reports/dependency-check/*.xml',
                        failedTotalHigh: 1,
                        failedTotalCritical: 1
                    )
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                powershell '''
                    Write-Host "Starting Trivy filesystem scan..."

                    New-Item -ItemType Directory -Force reports | Out-Null

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/project" `
                        aquasec/trivy:latest `
                        fs --config /project/security/trivy.yaml `
                        --severity HIGH,CRITICAL `
                        --exit-code 0 `
                        --format json `
                        --output /project/reports/trivy-fs-report.json `
                        /project

                    if ($LASTEXITCODE -ne 0) {
                        throw "Trivy filesystem scan failed."
                    }

                    Write-Host "Trivy filesystem report generated."
                    Write-Host "HIGH and CRITICAL findings are reported, not used to fail this build."
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                powershell '''
                    Write-Host "Building backend Docker image..."

                    docker build `
                        -t "${env:BACKEND_IMAGE}:${env:BUILD_NUMBER}" `
                        -f Dockerfile .

                    if ($LASTEXITCODE -ne 0) {
                        throw "Backend Docker build failed."
                    }

                    Write-Host "Building frontend Docker image..."

                    docker build `
                        -t "${env:FRONTEND_IMAGE}:${env:BUILD_NUMBER}" `
                        -f frontend/Dockerfile frontend

                    if ($LASTEXITCODE -ne 0) {
                        throw "Frontend Docker build failed."
                    }

                    Write-Host "Both Docker images built successfully."
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                powershell '''
                    Write-Host "Preparing Docker images for Trivy scanning..."

                    New-Item -ItemType Directory -Force reports | Out-Null

                    docker save `
                        -o reports/backend-image.tar `
                        "${env:BACKEND_IMAGE}:${env:BUILD_NUMBER}"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Backend image export failed."
                    }

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/project" `
                        aquasec/trivy:latest `
                        image --severity HIGH,CRITICAL `
                        --exit-code 0 `
                        --format json `
                        --output /project/reports/trivy-backend-image.json `
                        --input /project/reports/backend-image.tar

                    if ($LASTEXITCODE -ne 0) {
                        throw "Backend image scan failed."
                    }

                    Remove-Item reports/backend-image.tar -Force

                    docker save `
                        -o reports/frontend-image.tar `
                        "${env:FRONTEND_IMAGE}:${env:BUILD_NUMBER}"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Frontend image export failed."
                    }

                    docker run --rm `
                        --mount "type=bind,source=$env:WORKSPACE,target=/project" `
                        aquasec/trivy:latest `
                        image --severity HIGH,CRITICAL `
                        --exit-code 0 `
                        --format json `
                        --output /project/reports/trivy-frontend-image.json `
                        --input /project/reports/frontend-image.tar

                    if ($LASTEXITCODE -ne 0) {
                        throw "Frontend image scan failed."
                    }

                    Remove-Item reports/frontend-image.tar -Force

                    Write-Host "Trivy image scan reports generated."
                    Write-Host "Image vulnerability findings are reported, not used to fail this build."
                '''
            }
        }

        stage('Push Images') {
            when {
                expression {
                    return params.PUSH_IMAGES &&
                           (env.BRANCH_NAME == 'main' ||
                            env.GIT_BRANCH == 'origin/main')
                }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'registry-credentials',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    powershell '''
                        $env:REGISTRY_PASSWORD |
                            docker login -u $env:REGISTRY_USER --password-stdin

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker registry login failed."
                        }

                        docker tag `
                            "${env:BACKEND_IMAGE}:${env:BUILD_NUMBER}" `
                            "$($env:REGISTRY_USER)/${env:BACKEND_IMAGE}:${env:BUILD_NUMBER}"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Backend image tagging failed."
                        }

                        docker tag `
                            "${env:FRONTEND_IMAGE}:${env:BUILD_NUMBER}" `
                            "$($env:REGISTRY_USER)/${env:FRONTEND_IMAGE}:${env:BUILD_NUMBER}"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Frontend image tagging failed."
                        }

                        docker push "$($env:REGISTRY_USER)/${env:BACKEND_IMAGE}:${env:BUILD_NUMBER}"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Backend image push failed."
                        }

                        docker push "$($env:REGISTRY_USER)/${env:FRONTEND_IMAGE}:${env:BUILD_NUMBER}"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Frontend image push failed."
                        }

                        docker logout
                        Write-Host "Docker images pushed successfully."
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts(
                artifacts: 'reports/**/*,**/coverage.xml,**/lcov.info',
                allowEmptyArchive: true
            )
        }

        success {
            echo 'Smart Helpdesk CI pipeline completed. Review archived security reports before deployment.'
        }

        failure {
            echo 'Pipeline failed. Review the first failing stage in Console Output.'
        }
    }
}
