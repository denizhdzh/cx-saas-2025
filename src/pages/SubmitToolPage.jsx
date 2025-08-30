import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { db, storage, functions } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle, XCircle, Star, X, CreditCard, UploadSimple } from 'phosphor-react';

const initialFormData = {
  name: '',
  tagline: '',
  description: '',
  websiteUrl: '',
  logoFile: null,
  categories: [],
  tags: [],
  platforms: [],
  pricingModel: '',
  pricingDetails: '',
  features: [],
  useCases: [],
  integrations: [],
  targetAudience: [],
  submitterEmail: ''
};

export default function SubmitToolPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredPrice, setFeaturedPrice] = useState(100);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const categoryOptions = [
    'AI & Machine Learning', 'Productivity', 'Design', 'Development', 'Marketing',
    'Analytics', 'Communication', 'Project Management', 'Finance', 'E-commerce',
    'Education', 'Health', 'Entertainment', 'Security', 'Social Media', 'Content Creation', 'Customer Support', 'Utilities'
  ];

  const platformOptions = [
    'Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux', 'API', 'Browser Extension'
  ];

  const pricingOptions = [
    'Free', 'Freemium', 'Paid', 'One-time Purchase', 'Subscription', 'Usage-based', 'Contact for Pricing'
  ];

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, logoFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, logoFile: null }));
      setLogoPreview(null);
    }
  };

  const handleArrayInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()).filter(Boolean) }));
  };

  const handleMultiSelectChange = (name, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(selectedOption)
        ? prev[name].filter(item => item !== selectedOption)
        : [...prev[name], selectedOption]
    }));
  };

  const handleSubmit = async (e, isFeatured) => {
    e.preventDefault();
    if (formData.categories.length === 0) {
      setSubmitStatus({ message: 'Please select at least one category.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ message: '', type: '' });

    const slug = generateSlug(formData.name);
    if (!slug) {
        setSubmitStatus({ message: 'Tool name cannot be empty.', type: 'error' });
        setIsSubmitting(false);
        return;
    }

    let uploadedLogoUrl = '';
    let screenshotUrl = '';

    // Logo upload (zorunlu)
    if (!formData.logoFile) {
      setSubmitStatus({ message: 'Please upload a logo file.', type: 'error' });
      setIsSubmitting(false);
      return;
    }

      setIsUploadingLogo(true);
    setSubmitStatus({ message: 'Uploading logo...', type: 'info' });
    
      try {
      const logoRef = ref(storage, `logos/${slug}_${Date.now()}_${formData.logoFile.name}`);
        const snapshot = await uploadBytes(logoRef, formData.logoFile);
        uploadedLogoUrl = await getDownloadURL(snapshot.ref);
        setSubmitStatus({ message: 'Logo uploaded successfully.', type: 'info' });
      } catch (error) {
        console.error('Error uploading logo:', error);
      setSubmitStatus({ message: `Logo upload failed: ${error.message}. Please try again.`, type: 'error' });
        setIsUploadingLogo(false);
        setIsSubmitting(false);
        return;
      }
      setIsUploadingLogo(false);

    // Website screenshot al
    setSubmitStatus({ message: 'Taking website screenshot...', type: 'info' });
    try {
      const takeScreenshot = httpsCallable(functions, 'takeScreenshot');
      const screenshotResult = await takeScreenshot({
        url: formData.websiteUrl,
        toolId: slug
      });
      
      if (screenshotResult.data && screenshotResult.data.screenshotUrl) {
        screenshotUrl = screenshotResult.data.screenshotUrl;
        setSubmitStatus({ message: 'Screenshot captured successfully.', type: 'info' });
      }
    } catch (error) {
      console.warn('Screenshot failed:', error);
      // Screenshot başarısız olursa devam et, sadece uyar
      setSubmitStatus({ message: 'Screenshot could not be captured, but continuing...', type: 'info' });
    }

    try {
      const toolData = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        logoUrl: uploadedLogoUrl,
        screenshotUrl: screenshotUrl,
        categories: formData.categories,
        tags: formData.tags,
        platforms: formData.platforms,
        pricingModel: formData.pricingModel,
        pricingDetails: formData.pricingDetails,
        features: formData.features,
        useCases: formData.useCases,
        integrations: formData.integrations,
        targetAudience: formData.targetAudience,
        submitterEmail: formData.submitterEmail,
        slug: slug,
        status: 'pending',
        isFeatured: isFeatured,
        submittedByUID: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotesCount: 0,
        commentsCount: 0,
        source: 'free_submission'
      };

      await addDoc(collection(db, 'tools'), toolData);

      setSubmitStatus({ 
        message: 'Tool submitted successfully! We\'ll review it shortly.', 
        type: 'success' 
      });
      setFormData(initialFormData);
      setLogoPreview(null);
    } catch (error) {
      console.error('Error submitting tool:', error);
      if (!submitStatus.message.includes('Logo upload failed')) {
         setSubmitStatus({ message: `Error submitting tool: ${error.message}`, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeaturedPayment = async () => {
    setIsProcessingPayment(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // After successful payment, submit as featured
    const fakeEvent = { preventDefault: () => {} };
    await handleSubmit(fakeEvent, true);
    
    setIsProcessingPayment(false);
  };

  const getPriorityLevel = (price) => {
    if (price >= 100) return "Ultra High Priority";
    if (price >= 50) return "High Priority"; 
    if (price >= 30) return "Medium Priority";
    return "Standard Priority";
  };
  
  const renderArrayInput = (label, name, placeholder) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-300 mb-1">{label}</label>
      <input
        type="text"
        id={name}
        name={name}
        value={formData[name].join(', ')}
        onChange={(e) => handleArrayInputChange(name, e.target.value)}
        className="form-input"
        placeholder={placeholder}
        disabled={isSubmitting}
      />
    </div>
  );
  
  const renderCheckboxGroup = (label, name, options, isRequired = false) => (
    <div>
      <label className="block text-sm font-medium text-stone-300 mb-2">
        {label} {isRequired && <span className="text-red-400">*</span>}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer p-2 bg-stone-800/30 border border-stone-700/50 rounded-md hover:bg-stone-700/50 transition-colors">
            <input
              type="checkbox"
              checked={formData[name].includes(option)}
              onChange={() => handleMultiSelectChange(name, option)}
              className="w-4 h-4 bg-stone-700 border border-stone-600 rounded focus:ring-lime-400 accent-lime-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-stone-300">{option}</span>
          </label>
        ))}
      </div>
      {isRequired && formData[name].length === 0 && submitStatus.type === 'error' && submitStatus.message.includes('category') && (
        <p className="text-xs text-red-400 mt-1">Please select at least one category.</p>
      )}
    </div>
  );

  return (
    <>
    <Helmet>
        <title>Submit a Tool | tool/</title>
        <meta name="description" content="Found an awesome tool? Submit it to our directory and help others discover it. We review all submissions." />
    </Helmet>
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-100 sm:text-4xl">Submit a New Tool</h1>
        <p className="mt-3 text-lg text-stone-400">Help grow our directory by sharing a tool you find useful. All submissions are reviewed.</p>
        
        {/* Free Badge */}
        <div className="mt-4 inline-flex items-center gap-2 bg-lime-900/30 text-lime-300 px-4 py-2 rounded-full text-sm font-medium border border-lime-700/50">
          <CheckCircle className="w-4 h-4" />
          Free Submission
        </div>
      </div>

      {submitStatus.message && (
        <div className={`p-4 mb-6 rounded-md text-sm ${submitStatus.type === 'success' ? 'bg-lime-900/50 text-lime-200 border border-lime-700/60' : 'bg-red-900/50 text-red-200 border border-red-700/60'} flex items-center gap-3`}>
          {submitStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8 bg-stone-800/40 p-6 sm:p-8 rounded-lg border border-stone-700/60 shadow-xl">
        
        <section>
            <h2 className="section-title">Tool Information</h2>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-1">Tool Name <span className="text-red-400">*</span></label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="form-input" placeholder="e.g., Super Productive App" disabled={isSubmitting} />
            </div>
            <div>
                <label htmlFor="tagline" className="block text-sm font-medium text-stone-300 mb-1">Tagline <span className="text-red-400">*</span></label>
                <input type="text" name="tagline" id="tagline" value={formData.tagline} onChange={handleInputChange} required className="form-input" placeholder="A short, catchy description" disabled={isSubmitting} />
            </div>
            <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-stone-300 mb-1">Website URL <span className="text-red-400">*</span></label>
                <input type="url" name="websiteUrl" id="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} required className="form-input" placeholder="https://example.com" disabled={isSubmitting} />
            </div>
            
            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Logo <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="logoUpload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="logoUpload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-stone-600"
                    >
                      <UploadSimple className="w-4 h-4" />
                      Choose Logo File
                    </label>
                  </div>
                  
                  {logoPreview && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-stone-600" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, logoFile: null }));
                          setLogoPreview(null);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1">Upload a square logo (PNG, JPG, max 5MB)</p>
            </div>
            
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={4} className="form-textarea" placeholder="Detailed description of what the tool does, its main benefits, etc." disabled={isSubmitting}></textarea>
            </div>
        </section>

        <section>
            <h2 className="section-title">Details & Categorization</h2>
            {renderCheckboxGroup('Categories', 'categories', categoryOptions, true)}
            {renderCheckboxGroup('Platforms', 'platforms', platformOptions)}
            <div>
              <label htmlFor="pricingModel" className="block text-sm font-medium text-stone-300 mb-1">Pricing Model</label>
              <select name="pricingModel" id="pricingModel" value={formData.pricingModel} onChange={handleInputChange} className="form-select" disabled={isSubmitting}>
                <option value="">Select pricing model</option>
                {pricingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pricingDetails" className="block text-sm font-medium text-stone-300 mb-1">Pricing Details (optional)</label>
              <input type="text" name="pricingDetails" id="pricingDetails" value={formData.pricingDetails} onChange={handleInputChange} className="form-input" placeholder="e.g., $10/month for Pro plan, or specific free tier limits" disabled={isSubmitting} />
            </div>
            {renderArrayInput('Tags (comma-separated)', 'tags', 'ai, productivity, writing')}
        </section>

        <section>
            <h2 className="section-title">Further Information (Optional)</h2>
            {renderArrayInput('Key Features (comma-separated)', 'features', 'Feature A, Feature B, Feature C')}
            {renderArrayInput('Use Cases (comma-separated)', 'useCases', 'Content generation, Data analysis, Project collaboration')}
            {renderArrayInput('Integrations (comma-separated)', 'integrations', 'Slack, Google Workspace, Zapier')}
            {renderArrayInput('Target Audience (comma-separated)', 'targetAudience', 'Marketers, Developers, Small Businesses')}
        </section>
        
        <section>
            <h2 className="section-title">Your Information</h2>
            <div>
                <label htmlFor="submitterEmail" className="block text-sm font-medium text-stone-300 mb-1">Your Email (Optional)</label>
                <input type="email" name="submitterEmail" id="submitterEmail" value={formData.submitterEmail} onChange={handleInputChange} className="form-input" placeholder="your.email@example.com (Not displayed publicly)" disabled={isSubmitting} />
                <p className="text-xs text-stone-400 mt-1">We may use this to contact you if we have questions about your submission. It won't be shared publicly.</p>
            </div>
        </section>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3.5 rounded-lg text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-lime-500 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting Tool...' : 'Submit Tool for Review'}
          </button>
          
          {submitStatus.message && submitStatus.type === 'error' && (
             <p className="text-sm text-red-400 text-center mt-4">{submitStatus.message}</p>
          )}
           {submitStatus.message && submitStatus.type === 'success' && (
             <p className="text-sm text-lime-400 text-center mt-4">{submitStatus.message}</p>
          )}
        </div>
      </form>

      {/* Featured Modal */}
      {showFeaturedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-800 rounded-xl max-w-md w-full p-6 relative border border-stone-700">
            <button
              onClick={() => setShowFeaturedModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-100 mb-2">Get Featured Placement</h3>
              <p className="text-stone-400 text-sm">Appear at the top of search results for 1 full year</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Investment Amount (USD) - Higher amounts = Higher placement
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="19"
                    max="200"
                    value={featuredPrice}
                    onChange={(e) => setFeaturedPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>$19</span>
                    <span>$200+</span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-900/50 rounded-lg p-4 border border-stone-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-300">Amount:</span>
                  <span className="text-xl font-bold text-lime-400">${featuredPrice}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-300">Priority Level:</span>
                  <span className="text-sm font-medium text-yellow-400">{getPriorityLevel(featuredPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-300">Duration:</span>
                  <span className="text-sm text-stone-300">1 Year</span>
                </div>
              </div>

              <div className="text-xs text-stone-500 space-y-1">
                <p>• Your tool will appear at the top of relevant searches</p>
                <p>• Higher investment = higher ranking position</p>
                <p>• Featured badge and enhanced visibility</p>
                <p>• Valid for 365 days from payment</p>
              </div>

              <button
                onClick={handleFeaturedPayment}
                disabled={isProcessingPayment || isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                {isProcessingPayment ? 'Processing Payment...' : `Pay $${featuredPrice} & Get Featured`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
} 