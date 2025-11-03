#!/usr/bin/env bash
# Example curl calls for the Course MCQ Test module.

BASE_URL=${BASE_URL:-"https://test.ifda.in"}
TOKEN_HEADER=${TOKEN_HEADER:-""}

function info {
  echo "\n===== $1 ====="
}

AUTH_HEADER=""
if [[ -n "$TOKEN_HEADER" ]]; then
  AUTH_HEADER="-H Authorization: Bearer $TOKEN_HEADER"
fi

info "Create MCQ Test"
curl -X POST "$BASE_URL/api/course-mcq-tests" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "title": "Final MCQ Assessment",
    "description": "Final assessment covering all core topics.",
    "courseName": "Advanced Excel",
    "courseCode": "AEX-101",
    "passPercentage": 70,
    "durationMinutes": 45,
    "maxAttemptsPerStudent": 2,
    "questions": [
      {
        "prompt": "Which Excel function is used to find the average of a range?",
        "options": [
          "SUM",
          "AVG",
          "AVERAGE",
          "COUNT"
        ],
        "correctOptionIndex": 2,
        "explanation": "AVERAGE is the correct Excel function." 
      },
      {
        "prompt": "What shortcut inserts the current date in Excel?",
        "options": [
          "Ctrl + ;",
          "Ctrl + Shift + ;",
          "Ctrl + Shift + :",
          "Ctrl + :"
        ],
        "correctOptionIndex": 0,
        "explanation": "Ctrl + ; inserts the current date." 
      }
    ],
    "metadata": {
      "createdBy": "qa@tester",
      "tags": ["excel", "final", "assessment"]
    }
  }'

info "List MCQ Tests"
curl -X GET "$BASE_URL/api/course-mcq-tests" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER

info "Get MCQ Test By ID"
TEST_ID="<replace-with-test-id>"
curl -X GET "$BASE_URL/api/course-mcq-tests/$TEST_ID?includeAnswers=true" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER

info "Update MCQ Test"
curl -X PUT "$BASE_URL/api/course-mcq-tests/$TEST_ID" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "description": "Updated final assessment for Advanced Excel.",
    "isActive": true
  }'

info "Submit MCQ Test"
curl -X POST "$BASE_URL/api/course-mcq-tests/$TEST_ID/submit" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "studentId": "STU-001",
    "studentName": "Riya Sharma",
    "batchName": "Evening Batch",
    "answers": [
      {
        "questionId": "<replace-with-question-id-1>",
        "selectedOptionIndex": 2
      },
      {
        "questionId": "<replace-with-question-id-2>",
        "selectedOptionIndex": 0
      }
    ]
  }'

info "List Attempts for MCQ Test"
curl -X GET "$BASE_URL/api/course-mcq-tests/$TEST_ID/attempts" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER

info "Get Attempt By ID"
ATTEMPT_ID="<replace-with-attempt-id>"
curl -X GET "$BASE_URL/api/course-mcq-tests/attempts/$ATTEMPT_ID" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER
