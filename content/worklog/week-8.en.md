### Week 8 Objectives

* Start backend development with FastAPI framework.
* Implement JWT authentication for API security.
* Build dual-method food analysis: (1) "manual" — pure VLM prompt + USDA lookup, (2) "tools" — LLM tool-use loop with get_batch.
* Implement image compression for token optimization.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - FastAPI Project Setup <br>&emsp; + Initialized project with i18n support (Vietnamese & English) <br>&emsp; + Configured project structure: routes, models, services <br>&emsp; + Set up environment variables and .env configuration | 23/02/2026 | 23/02/2026 | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| 2 | - JWT Authentication Implementation <br>&emsp; + Implemented JWT token generation and validation using jose library <br>&emsp; + Created API key middleware for request authentication <br>&emsp; + Designed secure endpoint protection with service claim check | 24/02/2026 | 24/02/2026 | [JWT Docs] |
| 3 | - Async Backend Architecture <br>&emsp; + Designed async processing with BackgroundTasks <br>&emsp; + Implemented ThreadPool (AnyIO 100 threads) for concurrent AI inference <br>&emsp; + Created job ID system (UUID) for tracking background tasks <br>&emsp; + Auto cleanup old jobs when store exceeds 1000 | 25/02/2026 | 25/02/2026 | [AsyncIO Docs] |
| 4 | - Dual-Method Food Analysis Design <br>&emsp; + Method 1 "manual": Pure VLM prompt → CSV output (dishes table + ingredients table) <br>&emsp; + Method 2 "tools": LLM tool-use loop with get_batch tool calling for USDA batch lookup <br>&emsp; + Designed prompt_config.py with strict CSV output format to minimize tokens <br>&emsp; + Image compression (768px, JPEG q75) via prepare_image_for_bedrock() | 26/02/2026 | 26/02/2026 | [Bedrock Tool Use](https://docs.aws.amazon.com/bedrock/) |
| 5 | - API Endpoints Development <br>&emsp; + Created /analyze-food endpoint with ?method=tools|manual query param <br>&emsp; + Response time: < 100ms (return job ID immediately via HTTP 202) <br>&emsp; + Background processing via run_in_threadpool for heavy AI inference | 27/02/2026 | 27/02/2026 | [API Design] |
| 6-7 | - Testing & Refinement <br>&emsp; + Wrote initial test suite for API endpoints <br>&emsp; + Tested async job polling mechanism <br>&emsp; + Fixed edge cases in tool-use loop (max_tool_rounds=1) | 28/02/2026 | 01/03/2026 | [Test Suite] |

### Week 8 Achievements

* **Backend API:**
  * FastAPI project initialized with proper structure and i18n support.
  * API responds in **< 100ms** (returns job ID immediately via HTTP 202).
  * Background processing begins within **< 5 seconds** using ThreadPool (AnyIO 100 threads).

* **Dual-Method Food Analysis:**
  * **Method 1 "manual":** Pure VLM prompt analyzes image → outputs 2 CSV tables (dishes + ingredients) with name, weight, calories, protein, carbs, fat, confidence, cooking_method → can optionally cross-validate with USDA database lookup per ingredient.
  * **Method 2 "tools":** LLM tool-use loop — model sees image → calls `get_batch` tool with food items and weights → tool returns nutrition data from USDA → model adjusts and outputs final CSV.
  * Both methods share the same output format (FoodList schema) for API consistency.

* **Token Optimization:**
  * CSV output format enforced in prompts — strict 2-table format with pipe delimiters, no extra text.
  * Image compression via `prepare_image_for_bedrock()`: resize to 768px max dimension, JPEG q75, force compress if > 200KB.
  * Prompt engineering: minimal system prompt with compact rules (`[ROLE]`, `[TASK]`, `[OUTPUT]`).

* **Authentication:**
  * JWT authentication with jose library — validates service claim = "backend".
  * HTTP middleware protects /analyze-food, /analyze-label, /scan-barcode, /jobs/ endpoints.

### Challenges & Lessons

* **Challenges:**
  * Managing async tasks with proper error handling and timeout is complex.
  * Tool-use loop can enter infinite loops if the model doesn't converge.
  * Image format handling: different modes (P, RGBA, L) can crash JPEG compression.

* **Solutions:**
  * Implemented max_tool_rounds=1 limit to prevent infinite loops.
  * Added proper exception handling and job status tracking for failed tasks.
  * Image mode auto-conversion: P/RGBA → RGB before JPEG compression.

* **Lessons Learned:**
  * CSV output format dramatically reduces token usage vs JSON (~60% savings).
  * Image compression is essential — large images waste tokens in vision models.
  * Dual-method approach gives users flexibility: fast (manual) vs accurate (tools).

### Next Week Plan

* First commit to GitHub with full project structure.
* Build Gradio web UI for demo and testing.
* Implement label OCR pipeline for nutrition facts extraction.
* Create Dockerfile for containerized deployment.
