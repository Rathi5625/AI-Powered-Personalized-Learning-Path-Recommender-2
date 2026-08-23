package com.learningpath.dto.response;

import java.util.List;
import java.util.UUID;

public class AssessmentAnswerResponse {

    private UUID questionId;
    private String promptText;
    private List<String> options;
    private int selectedOptionIndex;
    private int correctOptionIndex;
    private boolean correct;
    private String explanation;

    public AssessmentAnswerResponse() {
    }

    public AssessmentAnswerResponse(UUID questionId, String promptText, List<String> options,
                                    int selectedOptionIndex, int correctOptionIndex,
                                    boolean correct, String explanation) {
        this.questionId = questionId;
        this.promptText = promptText;
        this.options = options;
        this.selectedOptionIndex = selectedOptionIndex;
        this.correctOptionIndex = correctOptionIndex;
        this.correct = correct;
        this.explanation = explanation;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public String getPromptText() {
        return promptText;
    }

    public void setPromptText(String promptText) {
        this.promptText = promptText;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public int getSelectedOptionIndex() {
        return selectedOptionIndex;
    }

    public void setSelectedOptionIndex(int selectedOptionIndex) {
        this.selectedOptionIndex = selectedOptionIndex;
    }

    public int getCorrectOptionIndex() {
        return correctOptionIndex;
    }

    public void setCorrectOptionIndex(int correctOptionIndex) {
        this.correctOptionIndex = correctOptionIndex;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
