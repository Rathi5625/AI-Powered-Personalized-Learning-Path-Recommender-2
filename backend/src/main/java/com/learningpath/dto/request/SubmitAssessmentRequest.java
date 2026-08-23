package com.learningpath.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class SubmitAssessmentRequest {

    @NotEmpty(message = "Answers list must not be empty")
    private List<AnswerItem> answers;

    public SubmitAssessmentRequest() {
    }

    public SubmitAssessmentRequest(List<AnswerItem> answers) {
        this.answers = answers;
    }

    public List<AnswerItem> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerItem> answers) {
        this.answers = answers;
    }

    public static class AnswerItem {
        @NotNull(message = "Question ID is required")
        private UUID questionId;

        private int selectedOptionIndex;

        public AnswerItem() {
        }

        public AnswerItem(UUID questionId, int selectedOptionIndex) {
            this.questionId = questionId;
            this.selectedOptionIndex = selectedOptionIndex;
        }

        public UUID getQuestionId() {
            return questionId;
        }

        public void setQuestionId(UUID questionId) {
            this.questionId = questionId;
        }

        public int getSelectedOptionIndex() {
            return selectedOptionIndex;
        }

        public void setSelectedOptionIndex(int selectedOptionIndex) {
            this.selectedOptionIndex = selectedOptionIndex;
        }
    }
}
