import { useApp } from '../contexts/AppContext';
import { useEffect } from 'react';

export function AboutPage() {
  const { state, reloadAboutContent, reloadTeamMembers } = useApp();
  
  // Load about content and team members when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          reloadAboutContent(),
          reloadTeamMembers()
        ]);
      } catch (error) {
        console.error('Error loading about page data:', error);
      }
    };
    
    loadData();
  }, [reloadAboutContent, reloadTeamMembers]);

  // Use content from state or show loading state
  const content = state.aboutContent || {
    id: 'default',
    title: 'Our Story',
    content: 'Welcome to our bakery. We are passionate about creating delicious baked goods with the finest ingredients.',
    images: ['/placeholder-about.jpg']
  };

  // Use team members from state or show empty array while loading
  const team = state.teamMembers.length > 0 
    ? state.teamMembers.map(member => ({
        name: member.name,
        role: member.role,
        image: member.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Our Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{content.title}</h1>
            <p className="text-lg text-gray-600 mb-6 whitespace-pre-line">
              {content.content}
            </p>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={content.images?.[0] || '/placeholder-about.jpg'}
              alt={content.title || "Tina's Bakery"}
              className="rounded-lg shadow-xl w-full h-auto object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-about.jpg';
              }}
            />
          </div>
        </div>

        {/* Meet the Team Section */}
        <div className="text-center mb-24">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Meet the Team</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The talented and passionate individuals who make Tina's Bakery special.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.length > 0 ? (
            team.map((member, index) => (
              <div key={`${member.name}-${index}`} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-48 h-48 mx-auto rounded-full shadow-lg mb-4 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`;
                  }}
                />
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-md text-amber-600 font-semibold">{member.role}</p>
              </div>
            ))
          ) : (
            // Show skeleton loaders while loading
            [1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="text-center">
                <div className="w-48 h-48 mx-auto rounded-full bg-gray-200 animate-pulse mb-4"></div>
                <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-5 w-24 bg-gray-100 rounded mx-auto"></div>
              </div>
            ))
          )}
        </div>

        {/* Contact Us Section */}
        <div className="bg-amber-100 rounded-lg p-12 mt-24 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Have a Question?</h2>
          <p className="text-xl text-gray-600 mb-8">
            We'd love to hear from you. Whether it's a custom cake inquiry or a question about our menu, feel free to reach out.
          </p>
          <a
            href="/contact"
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-amber-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
}