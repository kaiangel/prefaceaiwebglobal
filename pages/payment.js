import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Payment.module.css';

export default function Payment() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = () => {
    // In a real implementation, this would redirect to Stripe Checkout
    alert('Redirecting to Stripe checkout...');
    // Example redirect to Stripe:
    // window.location.href = 'https://checkout.stripe.com/...';
  };

  if (!user) {
    return null; // Wait for redirect
  }

  return (
    <>
      <Head>
        <title>Upgrade to Pro - Preface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Navbar />
      
      <div className={styles.paymentContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.pageTitle}>Upgrade to Preface Pro</h1>
          <p className={styles.pageSubtitle}>Unlock premium features to enhance your AI experience</p>
          
          <div className={styles.plansContainer}>
            <div className={styles.proPlanCard}>
              <div className={styles.planHeader}>
                <div className={styles.planBadge}>SPECIAL OFFER</div>
                <h2 className={styles.planTitle}>Preface Pro</h2>
                <div className={styles.pricingContainer}>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>{selectedPlan === 'monthly' ? '6.99' : '69.99'}</span>
                    <span className={styles.period}>/{selectedPlan === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {selectedPlan === 'monthly' && (
                    <div className={styles.discountPrice}>
                      First month $2.99
                    </div>
                  )}
                </div>
                
                <div className={styles.planTypeSelector}>
                  <button 
                    className={`${styles.planTypeButton} ${selectedPlan === 'monthly' ? styles.planTypeActive : ''}`}
                    onClick={() => handlePlanSelection('monthly')}
                  >
                    Monthly
                  </button>
                  <button 
                    className={`${styles.planTypeButton} ${selectedPlan === 'yearly' ? styles.planTypeActive : ''}`}
                    onClick={() => handlePlanSelection('yearly')}
                  >
                    Yearly <span className={styles.saveBadge}>Save 17%</span>
                  </button>
                </div>
              </div>
              
              <div className={styles.planFeatures}>
                <h3 className={styles.featuresTitle}>Everything in Free, plus:</h3>
                
                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <div className={styles.featureIcon}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.featureText}>
                      <span className={styles.featureName}>Priority Access</span>
                      <span className={styles.featureDescription}>The most advanced AI model - Grok 3/Claude 3.7 Sonnet</span>
                    </div>
                  </li>
                  
                  <li className={styles.featureItem}>
                    <div className={styles.featureIcon}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.featureText}>
                      <span className={styles.featureName}>Much More Credits</span>
                      <span className={styles.featureDescription}>300 credits per month</span>
                    </div>
                  </li>
                  
                  <li className={styles.featureItem}>
                    <div className={styles.featureIcon}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.featureText}>
                      <span className={styles.featureName}>Dual Expert Mode</span>
                      <span className={styles.featureDescription}>Access specialized dual-expert personas for deeper insights</span>
                    </div>
                  </li>
                  
                  <li className={styles.featureItem}>
                    <div className={styles.featureIcon}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.featureText}>
                      <span className={styles.featureName}>Enhanced History</span>
                      <span className={styles.featureDescription}>Store an unlimited history of your past prompts and results</span>
                    </div>
                  </li>
                  
                  <li className={styles.featureItem}>
                    <div className={styles.featureIcon}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.featureText}>
                      <span className={styles.featureName}>Priority Support</span>
                      <span className={styles.featureDescription}>Access to dedicated customer support</span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <button 
                className={styles.subscribeButton}
                onClick={handleCheckout}
              >
                Subscribe Now
              </button>
              <p className={styles.guaranteeText}>
                Cancel anytime.
              </p>
            </div>
            
            <div className={styles.comparePlansMobile}>
              <div className={styles.freePlanSummary}>
                <h3>Free Plan</h3>
                <ul>
                  <li>2 credits each day</li>
                  <li>Standard AI model - ChatGPT-4o mini</li>
                  <li>Single Expert Mode</li>
                  <li>Basic prompt history (30 days)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className={styles.testimonialsSection}>
            <h2 className={styles.testimonialsTitle}>What Our Pro Users Say</h2>
            <div className={styles.testimonialsList}>
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialContent}>
                  "The Pro version has completely transformed my productivity. The unlimited prompts and advanced models are worth every penny."
                </div>
                <div className={styles.testimonialAuthor}>Sarah K., Designer</div>
              </div>
              
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialContent}>
                  "Dual Expert Mode has been invaluable for my research work. I get much more insightful responses that combine different perspectives."
                </div>
                <div className={styles.testimonialAuthor}>Michael T., Researcher</div>
              </div>
              
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialContent}>
                  "Having unlimited history storage lets me easily reference and build on past work. It's made complex, long-term projects much easier to manage."
                </div>
                <div className={styles.testimonialAuthor}>David W., Content Creator</div>
              </div>
            </div>
          </div>
          
          <div className={styles.faqSection}>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>When will I be charged?</h3>
                <p className={styles.faqAnswer}>You'll be charged immediately upon subscribing. For monthly plans, the special first-month rate of $2.99 will apply, and subsequent months will be charged at the regular rate of $6.99.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Can I cancel my subscription?</h3>
                <p className={styles.faqAnswer}>Yes, you can cancel your subscription at any time from your profile page. Your benefits will continue until the end of your current billing period.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>What payment methods do you accept?</h3>
                <p className={styles.faqAnswer}>We accept all major credit cards, including Visa, Mastercard, American Express, and Discover.</p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Is there a free trial?</h3>
                <p className={styles.faqAnswer}>We offer a heavily discounted first month for just $2.99 instead of a free trial. You can cancel your subscription at any time if you're not satisfied.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}