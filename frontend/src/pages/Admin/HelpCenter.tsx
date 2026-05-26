import React, { useState } from 'react';
import { Input, Collapse, Button, message } from 'antd';
import { Search, Book, MessageCircle, FileText, ChevronRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Panel } = Collapse;

export default function HelpCenter() {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const handleLinkClick = (title: string) => {
    let url = 'https://google.com';
    if (title === 'Documentation') url = 'https://docs.example.com';
    if (title === 'Video Tutorials') url = 'https://youtube.com';
    if (title === 'Community Forum') url = 'https://forum.example.com';
    
    window.open(url, '_blank');
  };

  const handleCallUs = () => {
    window.location.href = 'tel:+15550199';
  };

  const handleContactSupport = () => {
    navigate('/admin/support');
  };

  const faqs = [
    {
      key: '1',
      question: 'How do I add a new product?',
      answer: 'To add a new product, navigate to the Products page and click the "New Entry" button in the sidebar or "Add Product" Action in the Trang chủ. Fill in the required details such as name, category, price, and upload product images before saving.'
    },
    {
      key: '2',
      question: 'How can I process a refund?',
      answer: 'Go to the Orders page, search for the specific order using the Order ID or customer name. Click on the order details and select the "Refund" option. Follow the prompts to confirm the refund amount and reason.'
    },
    {
      key: '3',
      question: 'How do I change my password?',
      answer: 'Click on your profile avatar in the bottom left corner and select "My Account". Navigate to the "Security" tab where you can enter your current password and set a new one.'
    },
    {
      key: '4',
      question: 'What do the different order statuses mean?',
      answer: 'PENDING: Order received but not yet processed. PACKING: Items are being gathered and packed. SHIPPING: Order is with the courier. SUCCESS: Order delivered successfully. FAILED: Order cancelled or payment failed.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchText.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-3xl font-bold text-[#191c1e]">How can we help you today?</h1>
        <div className="max-w-xl mx-auto">
          <Input 
            size="large" 
            placeholder="Search for articles, guides, or FAQs..." 
            prefix={<Search size={18} className="text-[#8f6f6c]" />}
            className="rounded-xl shadow-sm"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-white p-6 rounded-xl border border-[#d8dadc] shadow-sm hover:border-[#af101a] transition-colors cursor-pointer group"
          onClick={() => handleLinkClick('Documentation')}
        >
          <div className="w-12 h-12 bg-[#fff2f0] rounded-lg flex items-center justify-center text-[#af101a] mb-4 group-hover:scale-110 transition-transform">
            <Book size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#191c1e] mb-2">Documentation</h3>
          <p className="text-sm text-[#5b403d] mb-4">Detailed guides and API references for developers.</p>
          <div className="text-[#af101a] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Read Docs <ChevronRight size={16} />
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-xl border border-[#d8dadc] shadow-sm hover:border-[#00799c] transition-colors cursor-pointer group"
          onClick={() => handleLinkClick('Video Tutorials')}
        >
          <div className="w-12 h-12 bg-[#e0f2fe] rounded-lg flex items-center justify-center text-[#00799c] mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#191c1e] mb-2">Video Tutorials</h3>
          <p className="text-sm text-[#5b403d] mb-4">Step-by-step video guides for common tasks.</p>
          <div className="text-[#00799c] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Watch Videos <ChevronRight size={16} />
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-xl border border-[#d8dadc] shadow-sm hover:border-[#2a7a40] transition-colors cursor-pointer group"
          onClick={() => handleLinkClick('Community Forum')}
        >
          <div className="w-12 h-12 bg-[#d5fcde] rounded-lg flex items-center justify-center text-[#2a7a40] mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#191c1e] mb-2">Community Forum</h3>
          <p className="text-sm text-[#5b403d] mb-4">Connect with other admins and share best practices.</p>
          <div className="text-[#2a7a40] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Join Forum <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#191c1e] mb-6">Frequently Asked Questions</h2>
        {filteredFaqs.length > 0 ? (
          <Collapse ghost expandIconPosition="end" className="help-collapse">
            {filteredFaqs.map(faq => (
              <Panel 
                header={<span className="text-base font-medium text-[#191c1e]">{faq.question}</span>} 
                key={faq.key}
              >
                <p className="text-[#5b403d] leading-relaxed pl-4 border-l-2 border-[#e4beba]">
                  {faq.answer}
                </p>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <div className="text-center py-8 text-[#5b403d]">
            No FAQs found matching "{searchText}". Try a different search term.
          </div>
        )}
      </div>

      {/* Support Contact */}
      <div className="bg-[#191c1e] text-white rounded-xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-gray-300 max-w-md">
            Our support team is available 24/7 to assist you with any technical issues or account inquiries.
          </p>
        </div>
        <div className="flex gap-4 justify-center shrink-0">
          <Button size="large" icon={<Phone size={18} />} className="text-[#191c1e]" onClick={handleCallUs}>
            Call Us
          </Button>
          <Button type="primary" size="large" className="bg-[#af101a] hover:bg-[#ba1a20]" icon={<MessageCircle size={18} />} onClick={handleContactSupport}>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
