package com.learningpath.service.embedding;

import java.util.List;

public interface EmbeddingClient {

    /**
     * Generates an embedding for search queries or user goals (defaults to input_type="query").
     */
    float[] generateEmbedding(String text);

    /**
     * Generates an embedding specifically formatted as a search/user query (input_type="query").
     */
    float[] generateQueryEmbedding(String text);

    /**
     * Generates an embedding specifically formatted as a document/resource passage for indexing (input_type="passage").
     */
    float[] generatePassageEmbedding(String text);

    /**
     * Generates an embedding with an explicit input_type ("query" or "passage").
     */
    float[] generateEmbedding(String text, String inputType);

    /**
     * Generates embeddings for a batch of query texts (input_type="query").
     */
    List<float[]> generateEmbeddings(List<String> texts);

    /**
     * Generates embeddings for a batch of texts with an explicit input_type ("query" or "passage").
     */
    List<float[]> generateEmbeddings(List<String> texts, String inputType);

    /**
     * Returns the configured embedding vector dimension.
     */
    int getDimension();

    /**
     * Returns the configured embedding model name.
     */
    String getModel();

    /**
     * Returns true if a valid external API key is configured.
     */
    boolean isConfigured();
}
