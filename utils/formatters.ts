export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format: Aug 3, 2023
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid time';
  }
  
  // Format: 2:30 PM
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}