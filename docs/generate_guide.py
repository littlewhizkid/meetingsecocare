from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import os

SCREENSHOTS = os.path.join(os.path.dirname(__file__), 'screenshots')

def screenshot(name, caption=None, width_cm=16.6):
    path = os.path.join(SCREENSHOTS, f'{name}.png')
    if not os.path.exists(path):
        return []
    items = []
    img = RLImage(path, width=width_cm*cm)
    # Add border
    img_table = Table([[img]], colWidths=[width_cm*cm])
    img_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    items.append(img_table)
    if caption:
        items.append(Paragraph(caption, ParagraphStyle('cap',
            fontName='Helvetica-Oblique', fontSize=8,
            textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER,
            spaceBefore=3, spaceAfter=8)))
    return items

# Brand colours
GREEN_DARK  = colors.HexColor('#166534')
GREEN_MID   = colors.HexColor('#16a34a')
GREEN_LIGHT = colors.HexColor('#dcfce7')
GREEN_PALE  = colors.HexColor('#f0fdf4')
GRAY_TEXT   = colors.HexColor('#374151')
GRAY_LIGHT  = colors.HexColor('#f3f4f6')
GRAY_BORDER = colors.HexColor('#d1d5db')
AMBER_BG    = colors.HexColor('#fffbeb')
AMBER_BORDER= colors.HexColor('#f59e0b')

# ── Styles ──────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    fontName='Helvetica-Bold',
    fontSize=22,
    textColor=GREEN_DARK,
    spaceAfter=4,
    alignment=TA_CENTER,
)
subtitle_style = ParagraphStyle(
    'DocSubtitle',
    fontName='Helvetica',
    fontSize=11,
    textColor=GREEN_MID,
    spaceAfter=2,
    alignment=TA_CENTER,
)
url_style = ParagraphStyle(
    'Url',
    fontName='Helvetica',
    fontSize=9,
    textColor=colors.HexColor('#6b7280'),
    spaceAfter=0,
    alignment=TA_CENTER,
)
section_style = ParagraphStyle(
    'Section',
    fontName='Helvetica-Bold',
    fontSize=13,
    textColor=GREEN_DARK,
    spaceBefore=16,
    spaceAfter=6,
    borderPad=0,
)
body_style = ParagraphStyle(
    'Body',
    fontName='Helvetica',
    fontSize=10,
    textColor=GRAY_TEXT,
    spaceAfter=4,
    leading=15,
)
step_style = ParagraphStyle(
    'Step',
    fontName='Helvetica',
    fontSize=10,
    textColor=GRAY_TEXT,
    spaceAfter=4,
    leading=15,
    leftIndent=16,
)
bold_step_style = ParagraphStyle(
    'BoldStep',
    fontName='Helvetica-Bold',
    fontSize=10,
    textColor=GRAY_TEXT,
    spaceAfter=4,
    leading=15,
    leftIndent=16,
)
note_style = ParagraphStyle(
    'Note',
    fontName='Helvetica-Oblique',
    fontSize=9,
    textColor=colors.HexColor('#92400e'),
    spaceAfter=4,
    leading=13,
    leftIndent=10,
    rightIndent=10,
    backColor=AMBER_BG,
    borderColor=AMBER_BORDER,
    borderWidth=0,
    borderPad=6,
)
tip_style = ParagraphStyle(
    'Tip',
    fontName='Helvetica',
    fontSize=9,
    textColor=GRAY_TEXT,
    spaceAfter=3,
    leading=13,
    leftIndent=12,
)
subsection_style = ParagraphStyle(
    'SubSection',
    fontName='Helvetica-Bold',
    fontSize=10,
    textColor=GREEN_MID,
    spaceBefore=8,
    spaceAfter=4,
)
footer_style = ParagraphStyle(
    'Footer',
    fontName='Helvetica',
    fontSize=8,
    textColor=colors.HexColor('#9ca3af'),
    alignment=TA_CENTER,
)

def step(num, text):
    return Paragraph(f'<b>{num}.</b>  {text}', step_style)

def bullet(text):
    return Paragraph(f'&#x2022;  {text}', step_style)

def bold(text):
    return f'<b>{text}</b>'

# ── Document ─────────────────────────────────────────────────────────────────
output_path = 'docs/Panduan-Pemesanan-Ruang-Meeting-ecoCare.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=2.2*cm,
    leftMargin=2.2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
)

story = []

# ── Cover / Header ───────────────────────────────────────────────────────────
story.append(Spacer(1, 0.5*cm))

# Header banner table
header_data = [[Paragraph(
    '<font color="#166534"><b>ecoCare</b></font> '
    '<font color="#16a34a">Meeting Rooms</font>',
    ParagraphStyle('h', fontName='Helvetica-Bold', fontSize=20, textColor=GREEN_DARK, alignment=TA_CENTER)
)]]
header_table = Table(header_data, colWidths=[16.6*cm])
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), GREEN_PALE),
    ('ROUNDEDCORNERS', [8]),
    ('TOPPADDING', (0,0), (-1,-1), 14),
    ('BOTTOMPADDING', (0,0), (-1,-1), 14),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ('BOX', (0,0), (-1,-1), 1.5, GREEN_MID),
]))
story.append(header_table)
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph('Panduan Pengguna — Pemesanan Ruang Meeting', subtitle_style))
story.append(Paragraph('https://meeting.ecocare.id', url_style))
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width='100%', thickness=1.5, color=GREEN_MID, spaceAfter=12))

# ── Section 1: Masuk (Sign In) ───────────────────────────────────────────────
story.append(Paragraph('1.  Masuk ke Aplikasi', section_style))
story.append(body_style and Paragraph('Buka browser dan akses alamat berikut:', body_style))
story.append(Spacer(1, 0.1*cm))

url_box = Table([[Paragraph('<b>https://meeting.ecocare.id</b>',
    ParagraphStyle('url2', fontName='Helvetica-Bold', fontSize=11, textColor=GREEN_DARK, alignment=TA_CENTER)
)]], colWidths=[16.6*cm])
url_box.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), GREEN_LIGHT),
    ('BOX', (0,0), (-1,-1), 1, GREEN_MID),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(url_box)
story.append(Spacer(1, 0.2*cm))

story.append(step(1, f'Masukkan {bold("alamat email kerja")} Anda (contoh: namaanda@ecocare.co.id)'))
story.append(step(2, f'Masukkan {bold("password")} Anda'))
story.append(step(3, f'Klik tombol {bold("Sign In")}'))
story.append(Spacer(1, 0.15*cm))
story.append(Paragraph(
    'Catatan: Jika Anda belum pernah login atau lupa password, hubungi administrator sistem untuk mereset password Anda.',
    note_style
))
story.append(Spacer(1, 0.2*cm))
story.extend(screenshot('signin', 'Tampilan halaman login ecoCare Meeting Rooms'))

# ── Section 2: Kalender Pemesanan ────────────────────────────────────────────
story.append(Paragraph('2.  Tampilan Kalender Pemesanan', section_style))
story.append(Paragraph(
    'Setelah masuk, Anda akan melihat kalender utama yang menampilkan keempat ruang meeting secara berdampingan untuk tanggal yang dipilih.',
    body_style
))
story.append(Spacer(1, 0.2*cm))

room_data = [
    [Paragraph('<b>Ruang</b>', body_style),
     Paragraph('<b>Kapasitas</b>', body_style),
     Paragraph('<b>Cocok untuk</b>', body_style)],
    [Paragraph('Board Room', body_style),
     Paragraph('12 orang', body_style),
     Paragraph('Rapat besar, presentasi', body_style)],
    [Paragraph('Small Meeting Room', body_style),
     Paragraph('6 orang', body_style),
     Paragraph('Diskusi tim, pertemuan kecil', body_style)],
    [Paragraph('Podcast Room', body_style),
     Paragraph('10 orang', body_style),
     Paragraph('Rekaman, sesi pelatihan', body_style)],
    [Paragraph('Interview Room', body_style),
     Paragraph('4 orang', body_style),
     Paragraph('Wawancara, pertemuan pribadi', body_style)],
]
room_table = Table(room_data, colWidths=[5*cm, 3.5*cm, 8.1*cm])
room_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), GREEN_DARK),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, GRAY_LIGHT]),
    ('BOX', (0,0), (-1,-1), 1, GRAY_BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, GRAY_BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(room_table)
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    'Slot waktu yang <b>kosong</b> dapat diklik untuk melakukan pemesanan. Slot yang sudah terisi menampilkan detail booking yang ada.',
    body_style
))
story.append(Spacer(1, 0.2*cm))
story.extend(screenshot('calendar', 'Tampilan kalender pemesanan — empat ruang meeting ditampilkan berdampingan'))

# ── Section 3: Navigasi Tanggal ──────────────────────────────────────────────
story.append(Paragraph('3.  Navigasi Tanggal', section_style))
story.append(bullet(f'Klik {bold("panah kiri (←)")} untuk ke hari sebelumnya'))
story.append(bullet(f'Klik {bold("panah kanan (→)")} untuk ke hari berikutnya'))
story.append(bullet(f'Klik {bold("tanggal")} di tengah untuk membuka kalender dan langsung memilih tanggal tertentu'))

# ── Section 4: Memesan Ruang ─────────────────────────────────────────────────
story.append(Paragraph('4.  Cara Memesan Ruang Meeting', section_style))
story.append(step(1, 'Temukan ruang dan slot waktu yang Anda inginkan pada kalender'))
story.append(step(2, f'Klik pada {bold("slot yang kosong")} — formulir pemesanan akan muncul'))
story.append(step(3, 'Isi detail berikut:'))

detail_data = [
    [Paragraph('<b>Waktu Mulai</b>', body_style),
     Paragraph('Terisi otomatis dari slot yang diklik (dapat diubah)', body_style)],
    [Paragraph('<b>Waktu Selesai</b>', body_style),
     Paragraph('Pilih waktu berakhirnya rapat', body_style)],
    [Paragraph('<b>Nama Anda</b>', body_style),
     Paragraph('Terisi otomatis dari akun Anda', body_style)],
    [Paragraph('<b>Judul Rapat</b>', body_style),
     Paragraph('Masukkan deskripsi singkat rapat', body_style)],
]
detail_table = Table(detail_data, colWidths=[4.5*cm, 12.1*cm])
detail_table.setStyle(TableStyle([
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [GREEN_PALE, colors.white]),
    ('BOX', (0,0), (-1,-1), 1, GRAY_BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, GRAY_BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(Spacer(1, 0.1*cm))
story.append(detail_table)
story.append(Spacer(1, 0.15*cm))
story.append(step(4, f'Klik {bold("Konfirmasi Pemesanan")}'))
story.append(step(5, 'Notifikasi konfirmasi berwarna hijau akan muncul di bagian atas layar'))
story.append(Spacer(1, 0.1*cm))
story.append(Paragraph(
    'Catatan: Anda tidak dapat memesan slot waktu yang sudah terlewat.',
    note_style
))

# ── Section 5: Lihat Pemesanan ───────────────────────────────────────────────
story.append(Paragraph('5.  Melihat Pemesanan Anda', section_style))
story.append(step(1, f'Klik tombol {bold("My Bookings")} di pojok kanan atas layar'))
story.append(step(2, 'Panel akan terbuka dan menampilkan semua pemesanan Anda yang akan datang'))
story.append(step(3, 'Setiap pemesanan menampilkan nama ruang, tanggal, waktu, dan judul rapat'))

# ── Section 6: Batalkan Pemesanan ────────────────────────────────────────────
story.append(Paragraph('6.  Membatalkan Pemesanan', section_style))

story.append(Paragraph('Dari kalender:', subsection_style))
story.append(step(1, 'Temukan pemesanan Anda pada kalender (ditampilkan dalam warna hijau)'))
story.append(step(2, f'Arahkan kursor ke atasnya — tombol {bold("X")} akan muncul di sudut kanan atas'))
story.append(step(3, f'Klik {bold("X")} tersebut'))
story.append(step(4, f'Konfirmasi pembatalan dengan mengklik {bold("Yes, Cancel Booking")}'))

story.append(Paragraph('Dari My Bookings:', subsection_style))
story.append(step(1, f'Buka {bold("My Bookings")} (tombol di pojok kanan atas)'))
story.append(step(2, 'Temukan pemesanan yang ingin dibatalkan'))
story.append(step(3, f'Klik {bold("Cancel")} di samping pemesanan tersebut'))
story.append(step(4, 'Konfirmasi ketika diminta'))
story.append(Spacer(1, 0.1*cm))
story.append(Paragraph(
    'Catatan: Anda hanya dapat membatalkan pemesanan milik Anda sendiri. Administrator dapat membatalkan pemesanan siapa pun.',
    note_style
))

# ── Section 7: Keluar ────────────────────────────────────────────────────────
story.append(Paragraph('7.  Keluar dari Aplikasi', section_style))
story.append(Paragraph(
    f'Klik {bold("ikon keluar (panah →)")} di samping nama Anda di pojok kanan atas layar.',
    body_style
))

# ── Tips ─────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width='100%', thickness=1, color=GRAY_BORDER, spaceAfter=8))

tips_header = Table([[Paragraph('<b>Tips &amp; Informasi Penting</b>',
    ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=10, textColor=GREEN_DARK)
)]], colWidths=[16.6*cm])
tips_header.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), GREEN_LIGHT),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('BOX', (0,0), (-1,-1), 1, GREEN_MID),
]))
story.append(tips_header)

tips_data = [
    [Paragraph(f'&#x2022;  {bold("Bentrok jadwal?")} Sistem secara otomatis mencegah pemesanan yang tumpang tindih pada ruang yang sama.', tip_style)],
    [Paragraph(f'&#x2022;  {bold("Butuh waktu lebih lama?")} Pilih waktu mulai terlebih dahulu, lalu pilih waktu selesai yang sesuai.', tip_style)],
    [Paragraph(f'&#x2022;  {bold("Slot waktu lampau")} ditampilkan lebih redup dan tidak dapat diklik.', tip_style)],
    [Paragraph(f'&#x2022;  {bold("Semua waktu")} menggunakan Waktu Indonesia Barat (WIB, UTC+7).', tip_style)],
]
tips_table = Table(tips_data, colWidths=[16.6*cm])
tips_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.white),
    ('BOX', (0,0), (-1,-1), 1, GREEN_MID),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
]))
story.append(tips_table)

# ── Bantuan ──────────────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
help_data = [[Paragraph(
    'Butuh bantuan? Hubungi administrator sistem atau tim IT Anda.',
    ParagraphStyle('help', fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#1e40af'), alignment=TA_CENTER)
)]]
help_table = Table(help_data, colWidths=[16.6*cm])
help_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93c5fd')),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(help_table)

story.append(Spacer(1, 0.4*cm))
story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_BORDER, spaceAfter=6))
story.append(Paragraph('ecoCare Head Office  |  Sistem Pemesanan Ruang Meeting  |  meeting.ecocare.id', footer_style))

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f'PDF created: {output_path}')
