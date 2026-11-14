import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Building,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
} from 'lucide-react';
import { KELURAHAN_LIST, OrgContactInfo } from '../../types';
import { dbService, INITIAL_CONTACT_INFO } from '../../services/db';
import { TikTokIcon, formatSocialUrl } from '../../components/common/SocialIcons';

export const ContactPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<OrgContactInfo>(INITIAL_CONTACT_INFO);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    kelurahan: 'Babakan',
    businessName: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await dbService.getContactInfo();
        if (data) {
          setContactInfo(data);
        }
      } catch (err) {
        console.warn('Failed loading contact info:', err);
      }
    };
    loadContact();

    const unsubscribe = dbService.subscribeContactInfo((data) => {
      if (data) setContactInfo(data);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) setContactInfo(e.detail);
    };
    window.addEventListener('umkm_contact_info_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('umkm_contact_info_updated', handleUpdate);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'Bagaimana cara mendaftar menjadi anggota Forum UMKM KUAT?',
      a: 'Pelaku usaha yang memiliki domisili atau tempat usaha di 8 kelurahan se-Kecamatan Tangerang dapat mendaftar melalui koordinator kelurahan atau langsung mengisi permohonan ke Sekretariat Forum di Kantor Kecamatan Tangerang dengan membawa KTP dan foto produk.',
    },
    {
      q: 'Apakah pendaftaran anggota dipungut biaya?',
      a: 'Pendaftaran keanggotaan Forum UMKM KUAT tidak dipungut biaya registrasi. Iuran bulanan dikelola bendahara semata-mata untuk kas operasional serta untuk mendukung operasional Forum UMKM',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 block">
          Layanan Informasi & Aduan
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Hubungi Sekretariat Forum UMKM KUAT
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Konsultasikan kebutuhan perizinan usaha Anda, tanyakan informasi keanggotaan, atau sampaikan aspirasi Anda kepada pengurus Kecamatan Tangerang.
        </p>
      </div>

      {/* Main Grid: Info Cards + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121918] text-white rounded-2xl p-7 sm:p-8 space-y-6 border border-stone-800">
            <div>
              <span className="text-[11px] uppercase font-bold text-teal-400 tracking-[0.14em]">
                Lokasi Sekretariat
              </span>
              <h3 className="text-xl font-bold mt-1">{contactInfo.officeName || 'Kantor Kecamatan Tangerang'}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {contactInfo.subTitle || 'Pemerintah Kota Tangerang, Provinsi Banten'}
              </p>
            </div>

            <div className="space-y-4 text-sm text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {contactInfo.address}
                </span>
              </div>

              {contactInfo.phone && (
                <div className="flex items-center gap-3 tabular-nums">
                  <Phone className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span>Telepon: <a href={`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`} className="hover:text-teal-300">{contactInfo.phone}</a></span>
                </div>
              )}

              {contactInfo.whatsapp && (
                <div className="flex items-center gap-3 tabular-nums">
                  <MessageSquare className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span>Hotline WA: {contactInfo.whatsapp}</span>
                </div>
              )}

              {contactInfo.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <a href={`mailto:${contactInfo.email}`} className="hover:text-teal-300 transition-colors">
                    {contactInfo.email}
                  </a>
                </div>
              )}

              {contactInfo.operatingHours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Jam Layanan Konsultasi:</div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {contactInfo.operatingHours}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {contactInfo.whatsapp && (
              <div className="pt-4 border-t border-stone-800 space-y-3">
                {(() => {
                  const clean = (contactInfo.whatsapp || '').replace(/[^0-9]/g, '');
                  const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                  return (
                    <a
                      href={`https://wa.me/${formatted}?text=Halo%20Sekretariat%20Forum%20UMKM%20KUAT%20Kecamatan%20Tangerang,%20saya%20ingin%20berkonsultasi`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                    >
                      <span>Chat Langsung via WhatsApp</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  );
                })()}

                {contactInfo.googleMapsUrl && (
                  <a
                    href={contactInfo.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-200 py-2.5 rounded-xl font-bold text-xs transition-colors border border-stone-700"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>Petunjuk Lokasi Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* Social Media Channels */}
                {(contactInfo.instagram || contactInfo.tiktok || contactInfo.youtube || contactInfo.facebook) && (
                  <div className="pt-3 border-t border-stone-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Media Sosial Resmi Forum:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {contactInfo.instagram && (
                        <a
                          href={formatSocialUrl(contactInfo.instagram, 'instagram')}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
                        >
                          <Instagram className="w-3.5 h-3.5 text-stone-300" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {contactInfo.tiktok && (
                        <a
                          href={formatSocialUrl(contactInfo.tiktok, 'tiktok')}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
                        >
                          <TikTokIcon className="w-3.5 h-3.5 text-white" />
                          <span>TikTok</span>
                        </a>
                      )}
                      {contactInfo.youtube && (
                        <a
                          href={formatSocialUrl(contactInfo.youtube, 'youtube')}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
                        >
                          <Youtube className="w-3.5 h-3.5 text-red-400" />
                          <span>YouTube</span>
                        </a>
                      )}
                      {contactInfo.facebook && (
                        <a
                          href={formatSocialUrl(contactInfo.facebook, 'facebook')}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
                        >
                          <Facebook className="w-3.5 h-3.5 text-teal-400" />
                          <span>Facebook</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-6 text-xs text-teal-950 space-y-2">
            <div className="font-bold text-sm text-teal-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Pendampingan Bebas Biaya</span>
            </div>
            <p className="leading-relaxed text-teal-900/90">
              Seluruh pendampingan pengurusan legalitas usaha, NIB Berbasis Risiko, dan sertifikasi Halal Self-Declare melalui Forum UMKM KUAT didukung penuh oleh Dinas Koperasi & UKM dan tanpa pungutan liar.
            </p>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200">
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-in zoom-in-95">
              <div className="h-16 w-16 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-stone-900">Pesan Anda Telah Terkirim</h3>
              <p className="text-stone-600 text-sm max-w-md mx-auto">
                Terima kasih, <strong>{formData.name}</strong>. Pengurus Forum UMKM KUAT Kecamatan Tangerang akan segera menindaklanjuti pesan Anda.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      phone: '',
                      kelurahan: 'Babakan',
                      businessName: '',
                      message: '',
                    });
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Kirim Pesan Lain
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b border-stone-200 pb-4 mb-2">
                <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                  Formulir Minat Bergabung & Konsultasi
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Kirimkan data singkat Anda, tim pengurus kami akan menghubungi Anda kembali.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nomor WhatsApp / HP <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Kelurahan Domisili / Usaha <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.kelurahan}
                    onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:bg-white focus:outline-none focus:border-teal-600 font-medium text-stone-700 transition-colors"
                  >
                    {KELURAHAN_LIST.map((kel) => (
                      <option key={kel} value={kel}>
                        Kelurahan {kel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nama Usaha / Produk (Jika Ada)
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Contoh: Keripik Cisadane"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Keperluan / Pertanyaan Anda <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tuliskan pertanyaan seputar keanggotaan, pendaftaran NIB, stand bazar, dsb..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirimkan Pesan Sekarang</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FAQ SECTION */}
      <section className="bg-white rounded-2xl p-7 sm:p-10 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 block">
            Tanya Jawab
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-stone-600 text-sm">
            Informasi penting yang perlu Anda ketahui mengenai Forum UMKM KUAT Kecamatan Tangerang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-stone-50 p-6 rounded-xl border border-stone-200 space-y-2"
            >
              <div className="flex items-start gap-2.5 font-bold text-stone-900 text-sm sm:text-base">
                <HelpCircle className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm pl-7 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
