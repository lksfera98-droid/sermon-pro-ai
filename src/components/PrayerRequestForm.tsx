import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface PrayerRequestFormProps {
  onSuccess?: () => void;
}

export const PrayerRequestForm = ({ onSuccess }: PrayerRequestFormProps) => {
  const { language, t } = useLanguage();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [requestText, setRequestText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestText.trim()) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (!isAnonymous && !authorName.trim()) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting prayer request submission...');

    try {
      let imageUrl = null;

      // Upload image if provided
      if (image) {
        console.log('Uploading image...');
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('prayer-images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('prayer-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Get current user if logged in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
      }
      
      console.log('Current user:', user?.id);

      // Insert prayer request
      console.log('Inserting prayer request...');
      const { error: insertError } = await supabase
        .from('prayer_requests')
        .insert({
          language,
          request_text: requestText,
          author_name: isAnonymous ? null : authorName,
          is_anonymous: isAnonymous,
          image_url: imageUrl,
          user_id: user?.id || null,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Prayer request inserted successfully');

      toast({
        title: t('success'),
        description: t('prayerRequestSent'),
      });

      // Reset form
      setRequestText("");
      setAuthorName("");
      setImage(null);
      setIsAnonymous(false);
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error submitting prayer request:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: t('error'),
        description: error.message || t('tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('newPrayerRequest')}</CardTitle>
        <CardDescription>
          {t('sharePrayerRequest')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous">
              {t('sendAnonymously')}
            </Label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('yourName')}
              </Label>
              <Input
                id="name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t('enterYourName')}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="request">
              {t('prayerRequest')} *
            </Label>
            <Textarea
              id="request"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={t('writeYourRequest')}
              className="min-h-[120px]"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              {t('image')} ({t('optional')})
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="cursor-pointer"
              />
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImage(null)}
                  disabled={isSubmitting}
                >
                  {t('remove')}
                </Button>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('sendRequest')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
