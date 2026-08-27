package com.learningpath.controller;

import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.service.llm.LlmClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HealthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private LlmClient llmClient;

    @Mock
    private EmbeddingClient embeddingClient;

    @InjectMocks
    private HealthController healthController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();
    }

    @Test
    @DisplayName("Should return 200 OK for basic health check")
    void shouldReturnOkForHealth() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should return AI health diagnostics with model and dimensions")
    void shouldReturnAiHealthDiagnostics() throws Exception {
        when(llmClient.isConfigured()).thenReturn(true);
        when(llmClient.getModel()).thenReturn("nvidia/nemotron-3-super-120b-a12b");
        when(embeddingClient.isConfigured()).thenReturn(true);
        when(embeddingClient.getModel()).thenReturn("nvidia/llama-nemotron-embed-vl-1b-v2");
        when(embeddingClient.getDimension()).thenReturn(2048);

        mockMvc.perform(get("/api/health/ai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.aiProvider").value("NVIDIA"))
                .andExpect(jsonPath("$.llmConfigured").value(true))
                .andExpect(jsonPath("$.llmModel").value("nvidia/nemotron-3-super-120b-a12b"))
                .andExpect(jsonPath("$.embeddingConfigured").value(true))
                .andExpect(jsonPath("$.embeddingModel").value("nvidia/llama-nemotron-embed-vl-1b-v2"))
                .andExpect(jsonPath("$.embeddingDimension").value(2048));
    }
}
