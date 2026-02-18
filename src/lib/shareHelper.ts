import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a share token for a document and return the public share URL.
 * If the document already has a share_token, reuse it.
 */
export async function getOrCreateShareUrl(documentId: string): Promise<string> {
  // Check if token already exists
  const { data: existing } = await supabase
    .from('documents')
    .select('share_token')
    .eq('id', documentId)
    .single();

  if (existing?.share_token) {
    return `${window.location.origin}/share/${existing.share_token}`;
  }

  // Generate a new token
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

  const { error } = await supabase
    .from('documents')
    .update({ share_token: token } as any)
    .eq('id', documentId);

  if (error) {
    console.error('Error creating share token:', error);
    throw error;
  }

  return `${window.location.origin}/share/${token}`;
}
