package taltech.ee.FinalThesis.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import taltech.ee.FinalThesis.domain.dto.AiActionDto;
import taltech.ee.FinalThesis.domain.dto.AiChatResponse;
import taltech.ee.FinalThesis.services.AiChatService;
import taltech.ee.FinalThesis.services.AiContextBuilder;

import java.util.*;

@Service
@Slf4j
public class AiChatServiceImpl implements AiChatService {

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o";

    private static final Set<String> VALID_ACTION_TYPES = Set.of("ADD_ITEM", "IMPORT_GRAPH_ITEM", "ADD_SCHEDULE");
    private static final Set<String> VALID_ITEM_TYPES = Set.of(
        "MODULE", "TOPIC", "LEARNING_OUTCOME", "TASK", "TEST", "LEARNING_MATERIAL", "KNOBIT"
    );

    private static final String BASE_SYSTEM_PROMPT = """
            Sa oled Eesti haridussusteemi oppekava loomise assistent. \
            Aitad opetajatel luua tookavade struktuuri, valida opivaljundeid, \
            planeerida sisu ja ajakava. Vastad alati eesti keeles, \
            oled sobralik ja konkreetne. Kui kusitakse midagi, \
            mis ei ole seotud oppekava loomisega, suuna vestlus tagasi teemale.

            OLULINE: Sinu vastus PEAB olema AINULT kehtiv JSON objekt. Mitte kunagi ara vasta lihttekstina.
            Vastuse formaat on ALATI:
            {"reply": "sinu tekstiline vastus siin", "actions": []}

            Naide 1 - tavaline vastus ilma soovitusteta:
            {"reply": "Sinu oppekava naeb hea valja! Algebra moodul katab pohilised teemad.", "actions": []}

            Naide 2 - vastus koos soovitustega (kui kasutaja kusib konkreetseid soovitusi):
            {"reply": "Siin on puuduvad teemad:", "actions": [{"type": "ADD_ITEM", "label": "Funktsioonid", "description": "Funktsiooni moiste ja graafikud", "itemType": "TOPIC", "parentTitle": "Algebra"}, {"type": "ADD_ITEM", "label": "Geomeetria", "description": "Tasandilised kujundid ja nende omadused", "itemType": "TOPIC", "parentTitle": null}]}

            Naide 3 - ajakava soovitus:
            {"reply": "Soovitan jargmised tunnijaotused:", "actions": [{"type": "ADD_SCHEDULE", "label": "Lineaarvorrandid -> 4 tundi", "description": "Piisav aeg pohi- ja tekstulesannete jaoks", "targetTitle": "Lineaarvorrandid", "hours": 4}]}

            reply valis kasuta markdown-formaati: **paksus kirjas**, - loendid, 1. nummerdatud loendid.
            Hoia reply luhike.

            actions massiivi valja tyypi kirjeldused:
            - ADD_ITEM: lisa element puusse. Nouab: type, label, itemType (MODULE/TOPIC/LEARNING_OUTCOME/TASK/TEST/LEARNING_MATERIAL/KNOBIT), parentTitle (voi null kui juurtase)
            - IMPORT_GRAPH_ITEM: impordi graafist. Nouab: type, label, itemType, parentTitle, externalIri. Kasuta AINULT siis kui kontekstis on tegelik IRI (iri: https://...).
            - ADD_SCHEDULE: soovita ajakava. Nouab: type, label, targetTitle, hours, description

            OLULINE: Ara kunagi motl valja externalIri voi muid URL-e! Kui kontekstis on "iri: https://...", kasuta IMPORT_GRAPH_ITEM selle IRI-ga. Kui IRI puudub, kasuta ADD_ITEM ilma externalIri-ta.

            Kui soovitusi pole, jata actions tuhja massiivina [].
            Kasuta action-kaarte AINULT konkreetsete soovituste jaoks, mitte iga vastuse jaoks.
            Kui kasutaja kusib soovitusi voi puuduvaid elemente, PEAD lisama need actions massiivi, mitte ainult reply teksti.
            Kui kasutaja kusib struktuuri kohta uldiselt, maini luhidalt kui graafist on veel elemente saadaval.""";

    private static final Map<Integer, String> STEP_PROMPTS = Map.of(
        1, "\nPraegu on samm 1 (Metaandmed). Aita metaandmete valikuga (aine, klass, kooliaste). Ara paku action-kaarte selles sammus.",
        2, "\nPraegu on samm 2 (Struktuur). Fookus on struktuuril. Soovita mooduleid, teemasid ja opivaljundeid. Kasuta ADD_ITEM ja IMPORT_GRAPH_ITEM action-kaarte konkreetsete soovituste tegemiseks.",
        3, "\nPraegu on samm 3 (Sisu). Fookus on sisul. Soovita ulesandeid, teste, oppematerjale ja knobiteid konkreetsete teemade ja opivaljundite alla. EELISTA ALATI graafis seotud sisu: kui kontekstis on opivaljundi voi teema all 'graafis seotud sisu' loend IRI-dega, kasuta IMPORT_GRAPH_ITEM action-kaarte nende elementidega ja seo need oige parentTitle-iga. Kasuta ADD_ITEM-i AINULT siis kui graafis sobivat elementi pole. Kui kasutaja palub soovitusi konkreetse opivaljundi alla ja sellel on graafis seotud sisu, paku KOIGEPEALT graafi elemente.",
        4, "\nPraegu on samm 4 (Ajakava). Fookus on ajakaval. Soovita tundide arvu elementidele. Kasuta ADD_SCHEDULE action-kaarte. Arvesta kogu kursuse mahtu."
    );

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final AiContextBuilder contextBuilder;
    private final ObjectMapper objectMapper;

    public AiChatServiceImpl(RestTemplate restTemplate,
                             @Value("${openai.api-key:}") String apiKey,
                             AiContextBuilder contextBuilder,
                             ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.contextBuilder = contextBuilder;
        this.objectMapper = objectMapper;
    }

    @Override
    public String chat(List<Map<String, String>> messages) {
        AiChatResponse response = chatWithContext(messages, null, null);
        return response.getReply();
    }

    @Override
    public AiChatResponse chatWithContext(List<Map<String, String>> messages, UUID versionId, Integer step) {
        if (apiKey == null || apiKey.isBlank()) {
            return AiChatResponse.builder()
                .reply("AI teenus pole konfigureeritud. Palun maara OPENAI_API_KEY keskkonnamuutuja.")
                .build();
        }

        // Build system prompt with context
        StringBuilder systemPrompt = new StringBuilder(BASE_SYSTEM_PROMPT);

        if (step != null && STEP_PROMPTS.containsKey(step)) {
            systemPrompt.append(STEP_PROMPTS.get(step));
        }

        if (versionId != null) {
            String context = contextBuilder.buildContext(versionId, step != null ? step : 1);
            systemPrompt.append("\n\n--- OPPEKAVA KONTEKST ---\n").append(context);
        }

        List<Map<String, String>> fullMessages = new ArrayList<>();
        fullMessages.add(Map.of("role", "system", "content", systemPrompt.toString()));
        fullMessages.addAll(messages);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("messages", fullMessages);
        body.put("max_tokens", 2048);
        body.put("temperature", 0.7);
        body.put("response_format", Map.of("type", "json_object"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                OPENAI_URL,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
            );

            if (response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText("");
                    return parseStructuredResponse(content);
                }
            }
            return AiChatResponse.builder()
                .reply("Vabandust, AI vastust ei onnestunud toodelda.")
                .build();
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            return AiChatResponse.builder()
                .reply("Viga AI teenusega uhendamisel: " + e.getMessage())
                .build();
        }
    }

    private AiChatResponse parseStructuredResponse(String content) {
        try {
            String cleaned = content.strip();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.strip();

            JsonNode json = objectMapper.readTree(cleaned);
            String reply = json.path("reply").asText("");
            List<AiActionDto> actions = new ArrayList<>();

            if (json.has("actions") && json.get("actions").isArray()) {
                for (JsonNode actionNode : json.get("actions")) {
                    AiActionDto action = objectMapper.treeToValue(actionNode, AiActionDto.class);
                    if (isValidAction(action)) {
                        actions.add(action);
                    }
                }
            }

            return AiChatResponse.builder()
                .reply(reply.isEmpty() ? content : reply)
                .actions(actions)
                .build();
        } catch (Exception e) {
            log.debug("AI response was not valid JSON, returning as plain text: {}", e.getMessage());
            return AiChatResponse.builder()
                .reply(content)
                .build();
        }
    }

    private boolean isValidAction(AiActionDto action) {
        if (action == null || action.getType() == null) return false;
        if (!VALID_ACTION_TYPES.contains(action.getType())) return false;
        if (action.getLabel() == null || action.getLabel().isBlank()) return false;

        return switch (action.getType()) {
            case "ADD_ITEM", "IMPORT_GRAPH_ITEM" ->
                action.getItemType() != null && VALID_ITEM_TYPES.contains(action.getItemType());
            case "ADD_SCHEDULE" ->
                action.getTargetTitle() != null && action.getHours() != null && action.getHours() > 0;
            default -> false;
        };
    }
}
