import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  const contactSchema = z.object({
    name: z.string().trim().min(1, t('contact.nameRequired')).max(100),
    email: z.string().trim().email(t('contact.emailInvalid')).max(255),
    type: z.enum(['question', 'reclamation', 'suggestion', 'autre']),
    subject: z.string().trim().min(1, t('contact.subjectRequired')).max(200),
    message: z.string().trim().min(10, t('contact.messageMin')).max(2000),
  });

  type ContactForm = z.infer<typeof contactSchema>;

  const types = [
    { value: 'question' as const, label: t('contact.question') },
    { value: 'reclamation' as const, label: t('contact.complaint') },
    { value: 'suggestion' as const, label: t('contact.suggestion') },
    { value: 'autre' as const, label: t('contact.other') },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'question' },
  });

  const onSubmit = async (data: ContactForm) => {
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    toast({ title: t('contact.sent'), description: t('contact.sentDesc') });
    reset();
  };

  return (
    <>
      <SEO
        title="Contact & Réclamations"
        description="Contactez l'équipe SpeedWork pour toute question, réclamation ou suggestion."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact SpeedWork",
          "description": "Page de contact et réclamations de SpeedWork",
          "url": "https://speedwork.pro/contact",
          "mainEntity": {
            "@type": "Organization",
            "name": "SpeedWork",
            "email": "speedwork033@gmail.com",
            "telephone": ["+242064446047", "+242053039818"],
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "29 Rue 650, Qtier Oyah",
              "addressLocality": "Oyo",
              "addressCountry": "CG"
            }
          }
        }}
      />
      <PublicNavbar />

      <main className="min-h-screen bg-background pt-8 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t('contact.title')}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 md:col-span-1">
              {[
                { icon: Mail, label: t('contact.email'), value: 'speedwork033@gmail.com' },
                { icon: Phone, label: t('contact.phone'), value: '+242 06 444 6047 / +242 05 303 9818' },
                { icon: MapPin, label: t('contact.address'), value: '29 Rue 650, Qtier Oyah, Oyo' },
              ].map((item) => (
                <Card key={item.label} className="border-border">
                  <CardContent className="flex items-start gap-3 p-4">
                    <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="md:col-span-2 border-border">
              <CardContent className="p-6">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <CheckCircle className="w-12 h-12 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">{t('contact.sentTitle')}</h2>
                    <p className="text-muted-foreground max-w-sm">
                      {t('contact.sentSubtitle')}
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      {t('contact.sendAnother')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">{t('contact.fullName')}</Label>
                        <Input id="name" placeholder="Jean Dupont" {...register('name')} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">{t('contact.email')}</Label>
                        <Input id="email" type="email" placeholder="jean@exemple.com" {...register('email')} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="type">{t('contact.requestType')}</Label>
                        <select
                          id="type"
                          {...register('type')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {types.map((tp) => (
                            <option key={tp.value} value={tp.value}>{tp.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="subject">{t('contact.subject')}</Label>
                        <Input id="subject" placeholder={t('contact.subjectPlaceholder')} {...register('subject')} />
                        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message">{t('contact.message')}</Label>
                      <Textarea
                        id="message"
                        placeholder={t('contact.messagePlaceholder')}
                        rows={5}
                        {...register('message')}
                      />
                      {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
                      <Send className="w-4 h-4" />
                      {isSubmitting ? t('contact.sending') : t('contact.send')}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
