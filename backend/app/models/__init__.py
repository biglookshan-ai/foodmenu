from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    main_image = Column(String(500))
    description = Column(Text)
    source_type = Column(String(50))
    source_url = Column(String(500))
    nutrition_json = Column(Text)
    
    ingredients = relationship("Ingredient", back_populates="recipe")
    steps = relationship("Step", back_populates="recipe")

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    name = Column(String(255), nullable=False)
    amount = Column(String(100))
    unit = Column(String(50))
    
    recipe = relationship("Recipe", back_populates="ingredients")

class Step(Base):
    __tablename__ = "steps"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    order = Column(Integer)
    instruction = Column(Text)
    duration_min = Column(Integer)
    
    recipe = relationship("Recipe", back_populates="steps")

class MealPlan(Base):
    __tablename__ = "mealplans"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    meal_type = Column(String(50))
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    completed = Column(Boolean, default=False)
    
    recipe = relationship("Recipe")
