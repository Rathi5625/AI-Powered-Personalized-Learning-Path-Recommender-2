package com.learningpath.service.embedding;

import java.util.List;

public interface EmbeddingClient {

    float[] generateEmbedding(String text);

    List<float[]> generateEmbeddings(List<String> texts);
}
