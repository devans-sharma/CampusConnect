export interface User {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  yearOfStudy: number;
  role: 'STUDENT' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  profileImage?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  _count?: {
    items: number;
  };
}

export interface ItemImage {
  id: string;
  itemId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  referenceNumber: string;
  reporterId: string;
  itemName: string;
  categoryId: string;
  itemType: 'LOST' | 'FOUND';
  publicDescription: string;
  privateVerificationDetails?: string;
  location: string;
  dateOccurred: string;
  colour?: string;
  brand?: string;
  distinguishingFeatures?: string;
  currentHoldingLocation?: string;
  contactPreference: 'EMAIL' | 'PHONE' | 'IN_APP';
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  images: ItemImage[];
  reporter?: {
    id: string;
    fullName: string;
    email?: string;
    studentId?: string;
    department: string;
    yearOfStudy?: number;
    profileImage?: string | null;
  };
  claims?: Claim[];
  _count?: {
    claims: number;
  };
}

export interface Claim {
  id: string;
  referenceNumber: string;
  itemId: string;
  claimantId: string;
  claimDescription: string;
  identifyingCharacteristics: string;
  supportingEvidence?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
  item?: Item;
  claimant?: {
    id: string;
    fullName: string;
    email: string;
    studentId: string;
    department: string;
    yearOfStudy?: number;
    profileImage?: string | null;
  };
  collection?: Collection;
}

export interface Collection {
  id: string;
  claimId: string;
  collectionLocation: string;
  collectionInstructions: string;
  scheduledAt: string;
  collectedAt?: string | null;
  confirmedById?: string | null;
  status: 'PENDING' | 'SCHEDULED' | 'READY_FOR_PICKUP' | 'COLLECTED' | 'CANCELLED';
  handoverNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  claim?: Claim;
  confirmedBy?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PotentialMatch {
  item: Item;
  confidenceScore: number;
  matchReasons: string[];
}
