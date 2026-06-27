from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str = ""

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "voise-audio"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    # Set after creating products in Stripe dashboard: Starter(free), Growth($199/mo), Pro($299/mo), Beta($79/mo)
    STRIPE_PRICE_GROWTH: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_PRICE_BETA: str = ""

    # Local dev: redis://localhost:6379/0
    # Upstash (prod): rediss://default:<TOKEN>@<host>.upstash.io:<port>
    REDIS_URL: str = "redis://localhost:6379/0"

    TRIAL_DAYS: int = 14
    APP_URL: str = "http://localhost:3000"

    LOG_PROMPTS: bool = False
    ENVIRONMENT: str = "development"

    # Model pricing (USD per 1M tokens)
    CLAUDE_SONNET_INPUT_PRICE: float = 3.0
    CLAUDE_SONNET_OUTPUT_PRICE: float = 15.0
    GPT4O_INPUT_PRICE: float = 2.5
    GPT4O_OUTPUT_PRICE: float = 10.0
    GPT4O_MINI_INPUT_PRICE: float = 0.15
    GPT4O_MINI_OUTPUT_PRICE: float = 0.60

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = {
            "claude-sonnet-4-6": (self.CLAUDE_SONNET_INPUT_PRICE, self.CLAUDE_SONNET_OUTPUT_PRICE),
            "gpt-4o": (self.GPT4O_INPUT_PRICE, self.GPT4O_OUTPUT_PRICE),
            "gpt-4o-mini": (self.GPT4O_MINI_INPUT_PRICE, self.GPT4O_MINI_OUTPUT_PRICE),
        }
        if model not in pricing:
            return 0.0
        in_price, out_price = pricing[model]
        return (input_tokens * in_price + output_tokens * out_price) / 1_000_000


settings = Settings()
