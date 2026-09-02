pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    NEXT_TELEMETRY_DISABLED = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'cd backend && npm ci --no-audit --no-fund && npx prisma generate'
        sh 'cd frontend && npm ci --no-audit --no-fund'
      }
    }

    stage('Lint') {
      steps {
        sh 'cd backend && npm run lint'
        sh 'cd frontend && npm run lint'
      }
    }

    stage('Unit Test') {
      steps {
        sh 'cd backend && npm test'
      }
    }

    stage('Integration Test') {
      steps {
        sh './scripts/test-integration.sh'
      }
    }

    stage('Application Build') {
      steps {
        sh 'cd backend && npm run build'
        sh 'cd frontend && npm run build'
      }
    }

    stage('Security Audit') {
      steps {
        sh 'cd backend && npm audit --audit-level=high'
        sh 'cd frontend && npm audit --audit-level=high'
      }
    }

    stage('Docker Compose Verification') {
      steps {
        sh 'docker compose config >/dev/null'
        sh 'docker compose build'
        sh 'docker compose up -d'
        sh './scripts/smoke-test.sh'
      }
    }

    stage('Persistence Verification') {
      steps {
        sh './scripts/verify-persistence.sh'
      }
    }

    stage('Browser E2E') {
      steps {
        sh './scripts/test-e2e.sh'
      }
    }
  }

  post {
    always {
      sh 'docker compose down -v --remove-orphans || true'
      sh 'docker compose -p pawfeed-integration -f docker-compose.test.yml down -v --remove-orphans || true'
      sh 'docker compose -p pawfeed-e2e down -v --remove-orphans || true'
    }
  }
}
