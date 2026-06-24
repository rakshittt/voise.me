from pydantic import BaseModel, Field


class CreatorContext(BaseModel):
    current_role: str = Field(default="", max_length=200)
    current_company: str = Field(default="", max_length=200)
    work_highlights: str = Field(default="", max_length=2000)
    expertise_topics: str = Field(default="", max_length=1000)
    credibility_markers: str = Field(default="", max_length=1000)


class CreatorContextResponse(BaseModel):
    creator_context: CreatorContext
