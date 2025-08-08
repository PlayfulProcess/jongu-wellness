export function isAdmin(userEmail: string): boolean {
  const adminEmails = [
    'pp@playfulprocess.com', // From your .env
    // Add your other admin emails here
  ];
  return adminEmails.includes(userEmail.toLowerCase());
}

export function isJonguReservedName(name: string): boolean {
  const reservedNames = ['jongu', 'Jongu', 'JONGU'];
  const lowerName = name.toLowerCase();
  
  return reservedNames.some(reserved => 
    lowerName.includes(reserved.toLowerCase()) ||
    lowerName === reserved.toLowerCase()
  );
}

export function canUseJonguName(userEmail: string): boolean {
  // Allow admins to use Jongu branding
  return isAdmin(userEmail);
}