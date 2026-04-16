import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Recipe, Step, updateRecipe } from '../utils/api';

interface RecipeEditModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const RecipeEditModal: React.FC<RecipeEditModalProps> = ({ recipe, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name || '');
      setMainImage(recipe.main_image || '');
      setDescription(recipe.description || '');
      setSteps(recipe.steps || []);
    }
  }, [recipe]);

  if (!isOpen || !recipe) return null;

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { order: steps.length + 1, instruction: '', duration_min: undefined }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Re-order remaining steps
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleStepChange = (index: number, field: keyof Step, value: string | number | undefined) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateRecipe(recipe.id, {
        name,
        main_image: mainImage,
        description,
        steps,
      });
      onSave(updated);
      onClose();
    } catch (err) {
      console.error('Failed to save recipe:', err);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">编辑菜谱</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">菜谱名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入菜谱名称"
            />
          </div>

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主图链接</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
            {mainImage && (
              <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={mainImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="描述这道菜谱..."
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">烹饪步骤</label>
              <button
                onClick={handleAddStep}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加步骤
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mt-1">
                    {step.order || index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={step.instruction}
                      onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                      placeholder={`步骤 ${index + 1} 的说明...`}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveStep(index)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {steps.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  暂无步骤，点击上方"添加步骤"开始
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeEditModal;
