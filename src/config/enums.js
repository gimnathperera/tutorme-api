const tutorTypes = [
  'International School Teacher',
  'Government School Teacher',
  'University Student',
  'A/L Student',
  'Diploma Holder',
  'Degree Holder',
  'Part-time Tutor',
  'Full-time Tutor',
  'International Retired Teacher',
  'Government Retired Teacher',
];

const genders = ['Male', 'Female'];

const nationalities = ['Sri Lankan', 'Others'];

const races = ['Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others'];

const tutorStatuses = ['pending', 'approved', 'rejected', 'suspended'];

const requestTutorStatuses = ['Pending', 'Approved', 'Tutor Assigned'];

const classTypes = [
  'Online - Individual',
  'Online - Group',
  'Physical - Individual',
  'Physical - Group',
  'In-Person - Individual',
  'In-Person - Group',
];

const classTypesExtended = [
  'Online - Individual',
  'Online - Group',
  'Physical - Individual',
  'Physical - Group',
  'Home Visit - Individual',
  'Home Visit - Group',
  "At Tutor's Place - Individual",
  "At Tutor's Place - Group",
  'In-Person - Individual',
  'In-Person - Group',
];

const requestTutorClassTypes = ['Online - Individual', 'Online - Group', 'Physical - Individual', 'Physical - Group'];

const tutoringLevels = [
  'Pre-School / Montessori',
  'Primary School (Grades 1-5)',
  'Ordinary Level (O/L) (Grades 6-11)',
  'Advanced Level (A/L) (Grades 12-13)',
  'International Syllabus (Cambridge, Edexcel, IB)',
  'Undergraduate',
  'Diploma / Degree',
  'Language (e.g., English, French, Japanese)',
  'Computing (e.g., Programming, Graphic Design)',
  'Music & Arts',
  'Special Skills',
];

const preferredLocations = [
  'Kollupitiya (Colombo 3)',
  'Bambalapitiya (Colombo 4)',
  'Havelock Town (Colombo 5)',
  'Wellawatte (Colombo 6)',
  'Cinnamon Gardens (Colombo 7)',
  'Borella (Colombo 8)',
  'Dehiwala',
  'Mount Lavinia',
  'Nugegoda',
  'Rajagiriya',
  'Kotte',
  'Battaramulla',
  'Malabe',
  'Moratuwa',
  'Gampaha',
  'Negombo',
  'Kadawatha',
  'Kiribathgoda',
  'Kelaniya',
  'Wattala',
  'Ja-Ela',
  'Kalutara',
  'Panadura',
  'Horana',
  'Wadduwa',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Kurunegala',
  'Puttalam',
  'Chilaw',
  'Ratnapura',
  'Kegalle',
  'Badulla',
  'Bandarawela',
  'Anuradhapura',
  'Polonnaruwa',
  'Jaffna',
  'Vavuniya',
  'Trincomalee',
  'Batticaloa',
  'No Preference',
];

const tutorMediums = ['Sinhala', 'English', 'Tamil'];

const highestEducationLevels = ['PhD', 'Masters', 'Bachelor Degree', 'Undergraduate', 'Diploma and Professional', 'AL'];

const highestEducationLevelsExtended = [
  'PhD',
  'Diploma',
  'Masters',
  'Bachelor Degree',
  'Undergraduate',
  'Diploma and Professional',
  'JC/A Levels',
  'Poly',
  'AL',
  'Others',
];

const sessionDurations = ['30 Minutes', 'One Hour', 'Two Hours'];

const sessionFrequencies = ['Once a Week', 'Twice a Week', 'Daily'];

module.exports = {
  tutorTypes,
  genders,
  nationalities,
  races,
  tutorStatuses,
  requestTutorStatuses,
  classTypes,
  classTypesExtended,
  requestTutorClassTypes,
  tutoringLevels,
  preferredLocations,
  tutorMediums,
  highestEducationLevels,
  highestEducationLevelsExtended,
  sessionDurations,
  sessionFrequencies,
};
