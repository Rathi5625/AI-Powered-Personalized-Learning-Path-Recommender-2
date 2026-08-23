package com.learningpath.dto.response;

import java.util.List;

public class RecommendationResponse {

    private LearningPathResponse learningPath;
    private List<String> candidateCourseIds;

    public RecommendationResponse() {
    }

    public RecommendationResponse(LearningPathResponse learningPath, List<String> candidateCourseIds) {
        this.learningPath = learningPath;
        this.candidateCourseIds = candidateCourseIds;
    }

    public LearningPathResponse getLearningPath() {
        return learningPath;
    }

    public void setLearningPath(LearningPathResponse learningPath) {
        this.learningPath = learningPath;
    }

    public List<String> getCandidateCourseIds() {
        return candidateCourseIds;
    }

    public void setCandidateCourseIds(List<String> candidateCourseIds) {
        this.candidateCourseIds = candidateCourseIds;
    }
}
