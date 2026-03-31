package taltech.ee.FinalThesis.services.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.services.AiChatService;

import java.util.*;

@Service
@Slf4j
public class AiChatServiceImpl implements AiChatService {

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";

    private static final String SYSTEM_PROMPT = """
            Sa oled Eesti haridussüsteemi õppekava loomise assistent. \
            Aitad õpetajatel luua töökavade struktuuri, valida õpiväljundeid, \
            planeerida sisu ja ajakava. Vastad alati eesti keeles, \
            oled sõbralik ja konkreetne. Kui küsitakse midagi, \
            mis ei ole seotud õppekava loomisega, suuna vestlus tagasi teemale.\
            \
            Vorminda vastused markdown-formaadis: kasuta **paksus kirjas** oluliste terminite jaoks, \
            - täppidega loendeid soovituste ja loetelute jaoks, \
            1. nummerdatud loendeid sammude jaoks, \
            ### pealkirju sektsioonide jaoks. \
            Hoia vastused lühikesed ja struktureeritud.""";

    private final RestTemplate restTemplate;
    private final String apiKey;

    public AiChatServiceImpl(RestTemplate restTemplate,
                             @Value("${openai.api-key:}") String apiKey) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
    }

    @Override
    public String chat(List<Map<String, String>> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            return "AI teenus pole konfigureeritud. Palun määra OPENAI_API_KEY keskkonnamuutuja.";
        }

        List<Map<String, String>> fullMessages = new ArrayList<>();
        fullMessages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        fullMessages.addAll(messages);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("messages", fullMessages);
        body.put("max_tokens", 1024);
        body.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    OPENAI_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            if (response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            return "Vabandust, AI vastust ei õnnestunud töödelda.";
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            return "Viga AI teenusega ühendamisel: " + e.getMessage();
        }
    }
}
