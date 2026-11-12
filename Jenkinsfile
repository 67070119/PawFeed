pipeline {
  agent { label 'pawfeed-docker' }
  options {
    timestamps()
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timeout(time: 120, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
  }
  triggers { pollSCM('H/5 * * * *') }
  parameters {
    booleanParam(name: 'DELIVER', defaultValue: (env.PAWFEED_AUTO_DELIVER ?: 'false').toBoolean(), description: 'Publish tested images to Docker Hub and deploy inside a persistent course container. Required for final delivery evidence.')
    string(name: 'REGISTRY_NAMESPACE', defaultValue: (env.PAWFEED_DOCKERHUB_NAMESPACE ?: ''), description: 'Docker Hub username or organization (no URL)')
    string(name: 'REGISTRY_CREDENTIALS_ID', defaultValue: 'dockerhub-pawfeed', description: 'Jenkins Username/Password credential ID; password is a Docker Hub access token')
    booleanParam(name: 'FAILURE_DEMO', defaultValue: false, description: 'Insert a failing unit test in the disposable course copy; Publish/Deploy must be skipped')
    booleanParam(name: 'LIVE_ROUTING', defaultValue: false, description: 'Also verify the real external routing provider; requires provider availability')
    string(name: 'DEPLOY_FRONTEND_PORT', defaultValue: '3100', description: 'Host localhost port for the persistent demo')
    string(name: 'DEPLOY_BACKEND_PORT', defaultValue: '3101', description: 'Host localhost port for demo API')
    string(name: 'DEPLOY_MAILPIT_PORT', defaultValue: '8125', description: 'Host localhost port for demo email inbox')
  }
  environment {
    COURSE_IMAGE = 'tuchsanai/devtools:2569_1'
    COURSE_KEEP_CONTAINER = '1'
    COURSE_RUN_E2E = '1'
  }
  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        checkout scm
        script {
          env.SOURCE_REVISION = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
          env.SOURCE_STATE = 'clean'
          env.CI_FAILURE_DEMO = params.FAILURE_DEMO.toString()
          env.COURSE_RUN_LIVE_ROUTING = params.LIVE_ROUTING ? '1' : '0'
          env.REGISTRY_NAMESPACE = params.REGISTRY_NAMESPACE.trim()
          env.DEPLOY_FRONTEND_PORT = params.DEPLOY_FRONTEND_PORT
          env.DEPLOY_BACKEND_PORT = params.DEPLOY_BACKEND_PORT
          env.DEPLOY_MAILPIT_PORT = params.DEPLOY_MAILPIT_PORT
          if (params.DELIVER && !(env.REGISTRY_NAMESPACE ==~ /[a-z0-9][a-z0-9_-]*/)) {
            error('DELIVER requires a valid Docker Hub namespace')
          }
          def ports = [params.DEPLOY_FRONTEND_PORT, params.DEPLOY_BACKEND_PORT, params.DEPLOY_MAILPIT_PORT]
          ports.each { port ->
            if (!(port ==~ /[0-9]{1,5}/) || port.toInteger() < 1024 || port.toInteger() > 65535) {
              error('Deployment ports must be integers between 1024 and 65535')
            }
          }
          if (ports.toSet().size() != 3) { error('Deployment ports must be distinct') }
          currentBuild.description = "${env.SOURCE_REVISION.take(12)} / ${params.DELIVER ? 'delivery' : 'verification only'}"
        }
      }
    }
    stage('Docker Preflight') {
      steps {
        sh 'docker info >/dev/null && docker compose version && for file in scripts/*.sh; do bash -n "$file" || exit; done'
      }
    }
    stage('Course Container Verification') {
      steps {
        // Per-gate logs/results include Install/Lint/Unit/Integration/Build/Audit/
        // Compose/Smoke/Persistence/Browser E2E. Any failure stops delivery.
        sh 'sh scripts/course-container-test.sh'
      }
    }
    stage('Publish Tested Images') {
      when { expression { params.DELIVER } }
      steps {
        withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REGISTRY_USERNAME', passwordVariable: 'REGISTRY_PASSWORD')]) {
          sh '''
            set +x
            printf '%s' "$REGISTRY_PASSWORD" | sh scripts/publish-images.sh
          '''
        }
      }
    }
    stage('Deploy and Verify in Course Container') {
      when { expression { params.DELIVER } }
      steps {
        withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REGISTRY_USERNAME', passwordVariable: 'REGISTRY_PASSWORD')]) {
          sh '''
            set +x
            printf '%s' "$REGISTRY_PASSWORD" | sh scripts/deploy-course.sh
          '''
        }
      }
    }
  }
  post {
    always {
      script {
        // Cleanup touches only the labelled disposable verification container.
        def cleanupCode = sh(script: 'sh scripts/cleanup-ci.sh', returnStatus: true)
        if (cleanupCode != 0) { echo 'CI cleanup failed; inspect Docker resources labelled io.pawfeed.purpose=verification' }
      }
      archiveArtifacts(artifacts: '.ci/results/**/*', allowEmptyArchive: true, fingerprint: true)
      junit(testResults: '.ci/results/e2e/e2e.xml', allowEmptyResults: true)
    }
  }
}
