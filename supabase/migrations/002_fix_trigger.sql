-- ═══════════════════════════════════════════════════════════════════
-- Migration 002 — Fix handle_new_user trigger
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Le trigger précédent pouvait lever une exception non capturée,
-- ce qui faisait annuler toute la transaction d'inscription et
-- affichait "Database error saving new users".
-- Ce correctif entoure l'INSERT d'un bloc EXCEPTION pour que même
-- en cas d'erreur la création du compte réussisse.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.users_profile (user_id, email, full_name, plan, credits_remaining)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'free',
      3
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Ne pas faire échouer l'inscription si le profil ne peut pas être créé.
    -- Le client crée le profil en fallback après la connexion.
    RAISE WARNING 'handle_new_user: could not create profile for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;

-- S'assurer que le trigger est bien en place
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
