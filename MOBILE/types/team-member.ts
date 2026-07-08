export type TeamMember = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  isActive?: boolean;
  active?: boolean;
  status?: string;
  profilePhoto?: string | null;
};

export type TeamMemberPayload = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  /** Backend flag for active/inactive. */
  isActive: boolean;
  /** Local gallery URI for multipart upload (file:// or content://). */
  teamMemberPhotoUri?: string | null;
  /** From expo-image-picker asset when available (helps MIME/filename for content:// URIs). */
  teamMemberPhotoMimeType?: string | null;
  teamMemberPhotoFileName?: string | null;
};
