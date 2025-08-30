import { Helmet } from 'react-helmet-async';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | ToolSlash</title>
        <meta name="description" content="Learn more about tool/, our mission, and the team behind this platform dedicated to helping you find the best tools." />
      </Helmet>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-stone-100 sm:text-5xl">
            About ToolSlash
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-300">
            Discovering the right tools shouldn't be a chore. We're here to make it simple.
          </p>
        </div>

        <div className="prose prose-invert prose-stone mx-auto lg:prose-lg xl:prose-xl text-stone-300 prose-headings:text-stone-100 prose-a:text-lime-400 hover:prose-a:text-lime-500">
          <h2>Our Mission</h2>
          <p>
            At ToolSlash, our mission is to create the most comprehensive and user-friendly directory of tools for creators, developers, marketers, and anyone looking to enhance their productivity and workflow. We believe that the right tool can be a game-changer, and finding it should be effortless.
          </p>
          <p>
            We aim to meticulously categorize and review a wide array of software, SaaS products, AI-powered solutions, and other digital resources. Our platform is built on the idea of community and shared knowledge, where users can discover, compare, and discuss tools to make informed decisions.
          </p>

          <h2>Why tool/?</h2>
          <p>
            In a digital landscape overflowing with options, it's easy to get lost. tool/ was born out of the need for a centralized, curated, and easily navigable platform where you can quickly find tools relevant to your specific needs. We focus on:
          </p>
          <ul>
            <li><strong>Comprehensive Listings:</strong> Striving to include a vast range of tools across numerous categories and platforms.</li>
            <li><strong>Programmatic Discovery:</strong> Leveraging smart organization and search to help you find tools through various criteria, including our unique approach to generating pages for every internal search.</li>
            <li><strong>Community Driven:</strong> While we start by listing tools, we envision a future where user reviews, upvotes, and discussions play a key role. (Future feature)</li>
            <li><strong>Free Access:</strong> Our core listings and discovery features are free, ensuring everyone has access to the information they need.</li>
          </ul>
          
          <h2>The Vision</h2>
          <p>
            We are just getting started. Our vision for tool/ is to become the go-to resource for anyone seeking digital tools. We plan to expand our features to include more in-depth comparisons, user-generated content, and personalized recommendations. Our ultimate goal is to help you save time, improve your work, and achieve your goals by connecting you with the perfect tools.
          </p>
          <p>
            Thank you for being a part of our journey!
          </p>
        </div>
      </main>
    </>
  );
} 