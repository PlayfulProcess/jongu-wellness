export function isAdmin(userEmail: string): boolean {
  const adminEmails = [
    'pp@playfulprocess.com', // From your .env
    // Add your other admin emails here
  ];
  return adminEmails.includes(userEmail.toLowerCase());
}

export function isRecursiveEcoReservedName(name: string): boolean {
  const reservedNames = ['recursiveeco', 'Recursive.eco', 'RECURSIVEECO', 'recursive.eco'];
  const lowerName = name.toLowerCase();
  
  return reservedNames.some(reserved => 
    lowerName.includes(reserved.toLowerCase()) ||
    lowerName === reserved.toLowerCase()
  );
}

export function canUseRecursiveEcoName(userEmail: string): boolean {
  // Allow admins to use Recursive.eco branding
  return isAdmin(userEmail);
}