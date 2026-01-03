"use server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Unauthorized: Please login.");

  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('discord_id', userId)
    .single();

  if (error || !data) throw new Error("Unauthorized! You are not an admin.");
}


export async function deleteAssetAction(id: string, filePath: string) {
    await checkAdmin();
    await supabaseAdmin.storage.from('uploads').remove([filePath]);
    await supabaseAdmin.from('assets').delete().eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function updateStatusAction(id: string, newStatus: string) {
    await checkAdmin();
    await supabaseAdmin.from('assets').update({ status: newStatus }).eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}


export async function updateAssetInfoAction(
  id: string, 
  title: string, 
  category: string, 
  isOfficial: boolean, 
  newFilePath?: string, 
  oldFilePath?: string
) {
  await checkAdmin();

  let updateData: any = { 
    title, 
    category,
    is_official: isOfficial
  };

  if (newFilePath && oldFilePath) {
    updateData.file_path = newFilePath;
    await supabaseAdmin.storage.from('uploads').remove([oldFilePath]);
  }

  const { error } = await supabaseAdmin
    .from('assets')
    .update(updateData)
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/'); 
  return { success: true };
}

export async function addNewAdminAction(discordId: string) {
    await checkAdmin();
    const { data } = await supabaseAdmin.from('admins').select('id').eq('discord_id', discordId).single();
    if (data) throw new Error("This user is already an admin.");
    const { error } = await supabaseAdmin.from('admins').insert({ discord_id: discordId });
    if (error) throw new Error(error.message);
    return { success: true };
}
  
export async function removeAdminAction(discordId: string) {
    await checkAdmin();
    const session = await getServerSession(authOptions);
    const myId = (session?.user as any)?.id;
    if (discordId === myId) throw new Error("You cannot remove yourself!");
    const { error } = await supabaseAdmin.from('admins').delete().eq('discord_id', discordId);
    if (error) throw new Error(error.message);
    return { success: true };
}