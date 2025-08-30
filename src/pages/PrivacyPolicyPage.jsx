import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | tool/</title>
        <meta name="description" content="Read the Privacy Policy for tool/ to understand how we collect, use, and protect your personal information." />
      </Helmet>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-stone-100 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-300">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert prose-stone mx-auto lg:prose-lg xl:prose-xl text-stone-300 prose-headings:text-stone-100 prose-a:text-lime-400 hover:prose-a:text-lime-500">
          <p>
            tool/ ("us", "we", or "our") operates the toolslash.com website (hereinafter referred to as the "Service").
          </p>
          <p>
            This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data. Our Privacy Policy for tool/ is managed with the help of a generic template and customized for our specific (planned) functionalities.
          </p>
          <p>
            We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy. Unless otherwise defined in this Privacy Policy, the terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, accessible from toolslash.com (to be created).
          </p>

          <h2>Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>

          <h3>Types of Data Collected</h3>

          <h4>Personal Data</h4>
          <p>
            While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:
          </p>
          <ul>
            <li>Email address (e.g., when submitting a tool, creating an account - future feature)</li>
            <li>First name and last name (e.g., for account profiles - future feature)</li>
            <li>Cookies and Usage Data</li>
          </ul>

          <h4>Usage Data</h4>
          <p>
            We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
          </p>

          <h4>Tracking & Cookies Data</h4>
          <p>
            We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information.
          </p>
          <p>
            Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Other tracking technologies are also used such as beacons, tags and scripts to collect and track information and to improve and analyze our Service.
          </p>
          <p>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
          <p>Examples of Cookies we may use (this will be refined as features are built):</p>
          <ul>
            <li><strong>Session Cookies.</strong> We may use Session Cookies to operate our Service.</li>
            <li><strong>Preference Cookies.</strong> We may use Preference Cookies to remember your preferences and various settings.</li>
            <li><strong>Security Cookies.</strong> We may use Security Cookies for security purposes.</li>
            <li><strong>Analytics Cookies.</strong> We may use third-party Service Providers like Google Analytics to monitor and analyze the use of our Service.</li>
          </ul>

          <h2>Use of Data</h2>
          <p>
            tool/ uses the collected data for various purposes:
          </p>
          <ul>
            <li>To provide and maintain the Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so (e.g., submitting tools, upvoting, commenting - future features)</li>
            <li>To provide customer care and support (e.g., via the contact form)</li>
            <li>To provide analysis or valuable information so that we can improve the Service</li>
            <li>To monitor the usage of the Service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To process tool submissions (verifying email, associating submissions with users)</li>
          </ul>

          <h2>Data Storage and Transfer</h2>
          <p>
            Your information, including Personal Data, may be stored and processed by Firebase (Google Cloud Platform) which has servers globally. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of your data and other personal information.
          </p>
          <p>
            Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
          </p>

          <h2>Disclosure of Data</h2>
          <h3>Legal Requirements</h3>
          <p>
            tool/ may disclose your Personal Data in the good faith belief that such action is necessary to:
          </p>
          <ul>
            <li>To comply with a legal obligation</li>
            <li>To protect and defend the rights or property of tool/</li>
            <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
            <li>To protect the personal safety of users of the Service or the public</li>
            <li>To protect against legal liability</li>
          </ul>

          <h2>Security of Data</h2>
          <p>
            The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data (e.g., using Firebase's security features), we cannot guarantee its absolute security.
          </p>

          <h2>Service Providers</h2>
          <p>
            We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
          </p>
          <p>
            These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose. (e.g., Google Analytics, Firebase).
          </p>

          <h2>Links to Other Sites</h2>
          <p>
            Our Service may contain links to other sites that are not operated by us (e.g., websites of the tools listed). If you click a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>
          <p>
            We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 18 ("Children").
          </p>
          <p>
            We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
          <p>
            We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "last updated" date at the top of this Privacy Policy.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul>
            {/* <li>By email: privacy@toolslash.com (conceptual)</li> */}
            <li>By visiting the contact page on our website: <a href="/contact">toolslash.com/contact</a></li>
          </ul>
        </div>
      </main>
    </>
  );
} 