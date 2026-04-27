-- ===============================================================
-- ESQUEMA MAESTRO DE SEGURIDAD Y ESTRUCTURA EMPRESARIAL (SUPABASE)
-- ===============================================================
-- Versión: 3.0 (Passion Red Edition - Fixed Order)
-- Descripción: Versión consolidada y corregida para evitar errores de relación inexistente.
-- ===============================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- 2. CONFIGURACIÓN DE STORAGE (BÚCKETS)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- ===============================================================
-- 3. DEFINICIÓN DE TABLAS (ORDEN DE DEPENDENCIAS)
-- ===============================================================

-- A. PERFILES (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- B. MEDIOS (MEDIA)
CREATE TABLE IF NOT EXISTS public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')) NOT NULL,
  caption TEXT,
  shares_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- C. MENSAJES (MESSAGES)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  ref_post_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- D. SUSCRIPCIONES PUSH
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- E. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('message', 'verification', 'system', 'like', 'follow_request', 'follow_accept')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- F. LIKES
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, media_id)
);

-- G. SEGUIDORES (FOLLOWS)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- H. ESTADO DE CHATS (USER_CHATS)
CREATE TABLE IF NOT EXISTS public.user_chats (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  last_cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, target_user_id)
);

-- I. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- J. SISTEMA DE PUBLICIDAD (ADS)
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cta_text TEXT DEFAULT 'Saber más',
  image_url TEXT NOT NULL,
  link_url TEXT,
  type TEXT CHECK (type IN ('image', 'video')) DEFAULT 'image',
  placement TEXT CHECK (placement IN ('feed', 'sidebar', 'interstitial')) DEFAULT 'feed',
  status TEXT CHECK (status IN ('active', 'paused', 'scheduled')) DEFAULT 'active',
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost_per_click DECIMAL(10, 2) DEFAULT 0,
  cost_per_impression DECIMAL(10, 2) DEFAULT 0,
  total_budget DECIMAL(10, 2) DEFAULT 0,
  spent_budget DECIMAL(10, 2) DEFAULT 0,
  priority INTEGER DEFAULT 0,
  shares_count BIGINT DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- K. REACCIONES A ANUNCIOS (AD_LIKES)
CREATE TABLE IF NOT EXISTS public.ad_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, ad_id)
);

-- ===============================================================
-- 4. SEGURIDAD RLS Y AYUDANTES
-- ===============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_likes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email' = 'privechat.vip@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===============================================================
-- 5. POLÍTICAS DE SEGURIDAD (RLS)
-- ===============================================================

-- PROFILES
DROP POLICY IF EXISTS "Perfiles visibles por usuarios" ON public.profiles;
CREATE POLICY "Perfiles visibles por usuarios" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios editan su info básica" ON public.profiles;
CREATE POLICY "Usuarios editan su info básica" ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR public.is_super_admin())
WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- MEDIA
DROP POLICY IF EXISTS "Medios visibles por usuarios" ON public.media;
CREATE POLICY "Medios visibles por usuarios" ON public.media FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios suben sus medios" ON public.media;
CREATE POLICY "Usuarios suben sus medios" ON public.media FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_verified = TRUE)
);

DROP POLICY IF EXISTS "Dueño o Admin eliminan medios" ON public.media;
CREATE POLICY "Dueño o Admin eliminan medios" ON public.media FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin());

-- MESSAGES
DROP POLICY IF EXISTS "Participantes leen mensajes" ON public.messages;
CREATE POLICY "Participantes leen mensajes" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  public.is_super_admin()
);

DROP POLICY IF EXISTS "Usuarios envían mensajes" ON public.messages;
CREATE POLICY "Usuarios envían mensajes" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Usuarios marcan como leido" ON public.messages;
CREATE POLICY "Usuarios marcan como leido" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id)
WITH CHECK ( (content = content) AND (sender_id = sender_id) AND (receiver_id = receiver_id) );

-- PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "Usuarios gestionan sus suscripciones push" ON public.push_subscriptions;
CREATE POLICY "Usuarios gestionan sus suscripciones push" ON public.push_subscriptions 
FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Usuarios ven sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios ven sus notificaciones" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios gestionan sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios gestionan sus notificaciones" ON public.notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema crea notificaciones" ON public.notifications;
CREATE POLICY "Sistema crea notificaciones" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- LIKES
DROP POLICY IF EXISTS "Likes visibles por todos" ON public.likes;
CREATE POLICY "Likes visibles por todos" ON public.likes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios gestionan sus likes" ON public.likes;
CREATE POLICY "Usuarios gestionan sus likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- FOLLOWS
DROP POLICY IF EXISTS "Follows visibles por involucrados" ON public.follows;
CREATE POLICY "Follows visibles por involucrados" ON public.follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Usuarios gestionan sus follows" ON public.follows;
CREATE POLICY "Usuarios gestionan sus follows" ON public.follows FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- USER CHATS
DROP POLICY IF EXISTS "Usuarios gestionan sus chats" ON public.user_chats;
CREATE POLICY "Usuarios gestionan sus chats" ON public.user_chats FOR ALL USING (auth.uid() = user_id OR public.is_super_admin());

-- AUDIT LOGS
DROP POLICY IF EXISTS "Solo Admins ven logs" ON public.audit_logs;
CREATE POLICY "Solo Admins ven logs" ON public.audit_logs FOR SELECT USING (public.is_super_admin());

-- ADS
DROP POLICY IF EXISTS "Anuncios visibles por todos" ON public.ads;
CREATE POLICY "Anuncios visibles por todos" ON public.ads FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo Admins gestionan anuncios" ON public.ads;
CREATE POLICY "Solo Admins gestionan anuncios" ON public.ads FOR ALL USING (public.is_super_admin());

-- AD_LIKES
DROP POLICY IF EXISTS "Reacciones anuncios visibles por todos" ON public.ad_likes;
CREATE POLICY "Reacciones anuncios visibles por todos" ON public.ad_likes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios reaccionan a anuncios" ON public.ad_likes;
CREATE POLICY "Usuarios reaccionan a anuncios" ON public.ad_likes FOR ALL USING (auth.uid() = user_id);

-- ===============================================================
-- 6. POLÍTICAS DE STORAGE
-- ===============================================================

DROP POLICY IF EXISTS "Acceso público a medios" ON storage.objects;
CREATE POLICY "Acceso público a medios" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Usuarios suben a media" ON storage.objects;
CREATE POLICY "Usuarios suben a media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'media' AND 
  auth.role() = 'authenticated' AND
  (SELECT is_verified FROM public.profiles WHERE id = auth.uid()) = TRUE
);

DROP POLICY IF EXISTS "Usuarios eliminan sus objetos" ON storage.objects;
CREATE POLICY "Usuarios eliminan sus objetos" ON storage.objects FOR DELETE USING (
  bucket_id = 'media' AND 
  (auth.uid() = owner OR public.is_super_admin())
);

-- ===============================================================
-- 7. FUNCIONES Y AUTOMATIZACIONES (TRIGGERS)
-- ===============================================================

-- Manejo de nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
BEGIN
  v_username := coalesce(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
  );
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name', 
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, cover_url, username, role, is_verified)
  VALUES (new.id, new.email, v_full_name, new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'cover_url', v_username, 'user', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(profiles.full_name, EXCLUDED.full_name),
    username = coalesce(profiles.username, EXCLUDED.username);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Notificación de Mensaje Nuevo
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, sender_id, type, title, content, link)
  VALUES (new.receiver_id, new.sender_id, 'message', 'Nuevo mensaje', 'Has recibido un nuevo mensaje privado.', '/messages');

  INSERT INTO public.user_chats (user_id, target_user_id, is_hidden, updated_at)
  VALUES (new.sender_id, new.receiver_id, false, now())
  ON CONFLICT (user_id, target_user_id) DO UPDATE SET is_hidden = false, updated_at = now();

  INSERT INTO public.user_chats (user_id, target_user_id, is_hidden, updated_at)
  VALUES (new.receiver_id, new.sender_id, false, now())
  ON CONFLICT (user_id, target_user_id) DO UPDATE SET is_hidden = false, updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE PROCEDURE public.notify_new_message();

-- Notificación de Like
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS trigger AS $$
DECLARE
  v_media_owner UUID;
BEGIN
  SELECT user_id INTO v_media_owner FROM public.media WHERE id = new.media_id;
  IF v_media_owner != new.user_id THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, content, link)
    VALUES (v_media_owner, new.user_id, 'like', 'Nuevo Like', 'A alguien le ha gustado tu publicación.', '/post/' || new.media_id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_like ON public.likes;
CREATE TRIGGER on_new_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE PROCEDURE public.notify_new_like();

-- Auditoría Automática
CREATE OR REPLACE FUNCTION public.process_audit_log() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, old.id, to_jsonb(old));
    RETURN old;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, new.id, to_jsonb(old), to_jsonb(new));
    RETURN new;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, new.id, to_jsonb(new));
    RETURN new;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.process_audit_log();

DROP TRIGGER IF EXISTS tr_audit_media ON public.media;
CREATE TRIGGER tr_audit_media AFTER INSERT OR UPDATE OR DELETE ON public.media FOR EACH ROW EXECUTE PROCEDURE public.process_audit_log();

-- Búsqueda de Texto Completo
CREATE OR REPLACE FUNCTION public.profiles_search_trigger() RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('spanish', coalesce(new.username, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.full_name, '')), 'B');
  RETURN new;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_search ON public.profiles;
CREATE TRIGGER tr_profiles_search BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.profiles_search_trigger();

-- ===============================================================
-- 8. FUNCIONES RPC ADICIONALES
-- ===============================================================

CREATE OR REPLACE FUNCTION public.increment_media_share(p_media_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.media SET shares_count = shares_count + 1 WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.toggle_media_reaction(p_user_id UUID, p_media_id UUID, p_reaction_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.likes (user_id, media_id, type)
  VALUES (p_user_id, p_media_id, p_reaction_type)
  ON CONFLICT (user_id, media_id) 
  DO UPDATE SET type = EXCLUDED.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    other_user_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    profile JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH active_participants AS (
        SELECT uc.target_user_id as other_id, uc.updated_at as activity_at
        FROM public.user_chats uc
        WHERE uc.user_id = p_user_id AND uc.is_hidden = FALSE
        UNION
        SELECT (CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END) as other_id, m.created_at as activity_at
        FROM public.messages m
        WHERE (m.sender_id = p_user_id AND m.deleted_by_sender = FALSE)
           OR (m.receiver_id = p_user_id AND m.deleted_by_receiver = FALSE)
    ),
    unique_participants AS (
        SELECT other_id, MAX(activity_at) as last_activity
        FROM active_participants
        GROUP BY other_id
    )
    SELECT 
        up.other_id as other_user_id,
        (SELECT m.content FROM public.messages m WHERE ((m.sender_id = p_user_id AND m.receiver_id = up.other_id AND m.deleted_by_sender = FALSE) OR (m.receiver_id = p_user_id AND m.sender_id = up.other_id AND m.deleted_by_receiver = FALSE)) ORDER BY m.created_at DESC LIMIT 1) as last_message,
        up.last_activity as last_message_at,
        (SELECT count(*) FROM public.messages m WHERE m.receiver_id = p_user_id AND m.sender_id = up.other_id AND m.is_read = FALSE AND m.deleted_by_receiver = FALSE) as unread_count,
        to_jsonb(p) as profile
    FROM unique_participants up
    JOIN public.profiles p ON p.id = up.other_id
    ORDER BY up.last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_user_id UUID, p_sender_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages SET is_read = TRUE, read_at = NOW(), is_delivered = TRUE, delivered_at = COALESCE(delivered_at, NOW())
    WHERE receiver_id = p_user_id AND sender_id = p_sender_id AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_messages_delivered(p_user_id UUID, p_sender_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages SET is_delivered = TRUE, delivered_at = COALESCE(delivered_at, NOW())
    WHERE receiver_id = p_user_id AND sender_id = p_sender_id AND is_delivered = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.broadcast_global_message(p_title TEXT, p_content TEXT, p_sender_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, sender_id, type, title, content, link)
  SELECT id, p_sender_id, 'system', p_title, p_content, '/' FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_ad_metric(ad_id UUID, metric_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF metric_type = 'impression' THEN
    UPDATE public.ads SET impressions = impressions + 1 WHERE id = ad_id;
  ELSIF metric_type = 'click' THEN
    UPDATE public.ads SET clicks = clicks + 1 WHERE id = ad_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_ad_share(p_ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ads SET shares_count = shares_count + 1 WHERE id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.toggle_ad_reaction(p_user_id UUID, p_ad_id UUID, p_reaction_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ad_likes (user_id, ad_id, type)
  VALUES (p_user_id, p_ad_id, p_reaction_type)
  ON CONFLICT (user_id, ad_id) 
  DO UPDATE SET type = EXCLUDED.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===============================================================
-- 9. CONFIGURACIÓN DE PUSH NOTIFICATIONS (WEBHOOKS)
-- ===============================================================

CREATE OR REPLACE FUNCTION public.handle_new_message_push()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://ais-dev-d6m2tqmyydzel37l6tigkn-328810327831.us-east1.run.app/api/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created_push ON public.messages;
CREATE TRIGGER on_message_created_push
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_push();

-- ===============================================================
-- 10. PERMISOS Y REALTIME
-- ===============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications, public.messages, public.profiles, public.media;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ===============================================================
-- 12. MIGRACIONES (ASEGURAR COLUMNAS EN BASES EXISTENTES)
-- ===============================================================

DO $$ 
BEGIN 
  -- Perfiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN ALTER TABLE public.profiles ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username') THEN ALTER TABLE public.profiles ADD COLUMN username TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN ALTER TABLE public.profiles ADD COLUMN full_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN ALTER TABLE public.profiles ADD COLUMN bio TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified') THEN ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'search_vector') THEN ALTER TABLE public.profiles ADD COLUMN search_vector tsvector; END IF;

  -- Media
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'shares_count') THEN ALTER TABLE public.media ADD COLUMN shares_count BIGINT DEFAULT 0; END IF;

  -- Messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_delivered') THEN ALTER TABLE public.messages ADD COLUMN is_delivered BOOLEAN DEFAULT FALSE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'delivered_at') THEN ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read') THEN ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read_at') THEN ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL; END IF;

  -- Ads
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'shares_count') THEN ALTER TABLE public.ads ADD COLUMN shares_count BIGINT DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'starts_at') THEN ALTER TABLE public.ads ADD COLUMN starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'ends_at') THEN ALTER TABLE public.ads ADD COLUMN ends_at TIMESTAMP WITH TIME ZONE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'priority') THEN ALTER TABLE public.ads ADD COLUMN priority INTEGER DEFAULT 0; END IF;
END $$;

-- 11. BACKFILL FINAL
INSERT INTO public.profiles (id, email, full_name, username, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1) || '_' || substr(id::text, 1, 4)), 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
