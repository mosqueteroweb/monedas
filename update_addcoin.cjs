const fs = require('fs');
const file = 'src/pages/AddCoin.jsx';
let content = fs.readFileSync(file, 'utf8');

// Import backgroundRemoval
if (!content.includes("processImageLocally")) {
    content = content.replace("import CropModal from '../components/CropModal';", "import CropModal from '../components/CropModal';\nimport { processImageLocally } from '../utils/backgroundRemoval';");
}

// Add state for bounding box tracking
if (!content.includes("initialCropBox")) {
    content = content.replace("const [cropType, setCropType] = useState(null); // 'front' or 'back'", "const [cropType, setCropType] = useState(null); // 'front' or 'back'\n  const [initialCropBox, setInitialCropBox] = useState(null);");
}

// Modify handleImageChange
const oldHandleImageChange = `  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';

    setProcessing(true);
    try {
      // 1. Compress initially (optional, but good for performance before crop)
      const compressedBlob = await compressImage(file);

      // 2. Open Crop Modal
      const imageUrl = URL.createObjectURL(compressedBlob);
      setImageToCrop(imageUrl);
      setCropType(type);
      setCropModalOpen(true);

    } catch (error) {
      console.error('Error preparing image for crop:', error);
      alert('Error al procesar la imagen.');
    } finally {
      setProcessing(false);
    }
  };`;

const newHandleImageChange = `  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';

    setProcessing(true);
    try {
      // 1. Compress initially
      const compressedBlob = await compressImage(file);

      // 2. Local AI Auto-Detection (Background removal to find coin)
      let detectedBox = null;
      try {
        const aiResult = await processImageLocally(compressedBlob);
        if (aiResult.boundingBox) {
           detectedBox = aiResult.boundingBox;
           console.log("Auto-detected coin bounds:", detectedBox);
        }
      } catch (aiError) {
        console.warn('Local AI detection failed, falling back to manual center crop:', aiError);
      }

      // 3. Open Crop Modal with or without initial bounding box
      const imageUrl = URL.createObjectURL(compressedBlob);
      setImageToCrop(imageUrl);
      setCropType(type);
      setInitialCropBox(detectedBox);
      setCropModalOpen(true);

    } catch (error) {
      console.error('Error preparing image for crop:', error);
      alert('Error al procesar la imagen.');
    } finally {
      setProcessing(false);
    }
  };`;

content = content.replace(oldHandleImageChange, newHandleImageChange);

// Pass initialCropBox to CropModal
const oldModal = `<CropModal
          image={imageToCrop}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
          title={cropType === 'front' ? 'Recortar Anverso' : 'Recortar Reverso'}
        />`;
const newModal = `<CropModal
          image={imageToCrop}
          initialBox={initialCropBox}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
          title={cropType === 'front' ? 'Recortar Anverso' : 'Recortar Reverso'}
        />`;
content = content.replace(oldModal, newModal);

fs.writeFileSync(file, content);
