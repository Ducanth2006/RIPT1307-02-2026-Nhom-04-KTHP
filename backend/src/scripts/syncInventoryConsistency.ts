import supabaseClient from '../config/supabase';

type CategoryRow = {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    slug: string | null;
    status: string | null;
    created_at: string | null;
};

type ProductRow = {
    id: number;
    name: string;
    category_id: number | null;
    base_price: number | null;
    brand: string | null;
    status: string | null;
    deleted_at: string | null;
};

type ProductImageRow = {
    id: number;
    product_id: number | null;
    image_url: string;
    is_main: boolean | null;
};

type ProductVariantRow = {
    id: number;
    product_id: number | null;
    sku: string;
    size: string | null;
    color: string | null;
    price: number | null;
    stock_quantity: number | null;
    cost_price: number | null;
};

type InventoryLogRow = {
    id: number;
    variant_id: number | null;
    action_type: string;
    quantity: number | null;
    cost_price: number | null;
};

const cheDo = process.argv.includes('--apply') ? 'apply' : 'dry-run';
const laCheDoApDung = cheDo === 'apply';

const taoSlugKhac = (slugCha: string | null, idCha: number) => {
    const baseSlug = slugCha && slugCha.trim() ? slugCha.trim() : `category-${idCha}`;
    return `${baseSlug}-khac`;
};

const taoSkuMacDinh = (productId: number) => {
    return `AUTO-${productId}-${Date.now()}`;
};

const logThongTin = (tieuDe: string, duLieu: unknown) => {
    console.log(`\n===== ${tieuDe} =====`);
    console.log(JSON.stringify(duLieu, null, 2));
};

async function layDuLieu() {
    const [
        { data: danhMuc, error: loiDanhMuc },
        { data: sanPham, error: loiSanPham },
        { data: hinhAnh, error: loiHinhAnh },
        { data: bienThe, error: loiBienThe },
        { data: lichSuKho, error: loiLichSuKho }
    ] = await Promise.all([
        supabaseClient.from('categories').select('id, name, description, parent_id, slug, status, created_at').order('id', { ascending: true }),
        supabaseClient.from('products').select('id, name, category_id, base_price, brand, status, deleted_at').order('id', { ascending: true }),
        supabaseClient.from('product_images').select('id, product_id, image_url, is_main').order('id', { ascending: true }),
        supabaseClient.from('product_variants').select('id, product_id, sku, size, color, price, stock_quantity, cost_price').order('id', { ascending: true }),
        supabaseClient.from('inventory_logs').select('id, variant_id, action_type, quantity, cost_price').order('id', { ascending: true })
    ]);

    if (loiDanhMuc) throw loiDanhMuc;
    if (loiSanPham) throw loiSanPham;
    if (loiHinhAnh) throw loiHinhAnh;
    if (loiBienThe) throw loiBienThe;
    if (loiLichSuKho) throw loiLichSuKho;

    return {
        danhMuc: (danhMuc ?? []) as CategoryRow[],
        sanPham: (sanPham ?? []) as ProductRow[],
        hinhAnh: (hinhAnh ?? []) as ProductImageRow[],
        bienThe: (bienThe ?? []) as ProductVariantRow[],
        lichSuKho: (lichSuKho ?? []) as InventoryLogRow[]
    };
}

async function dongBo() {
    console.log(`Bat dau dong bo inventory o che do: ${cheDo}`);

    const { danhMuc, sanPham, hinhAnh, bienThe, lichSuKho } = await layDuLieu();

    const danhMucTheoId = new Map(danhMuc.map(item => [item.id, item]));
    const conTheoDanhMucCha = new Map<number, CategoryRow[]>();
    const sanPhamTheoDanhMuc = new Map<number, ProductRow[]>();
    const bienTheTheoSanPham = new Map<number, ProductVariantRow[]>();
    const hinhAnhTheoSanPham = new Map<number, ProductImageRow[]>();
    const lichSuTheoBienThe = new Map<number, InventoryLogRow[]>();

    for (const item of danhMuc) {
        if (item.parent_id) {
            const danhSachCon = conTheoDanhMucCha.get(item.parent_id) ?? [];
            danhSachCon.push(item);
            conTheoDanhMucCha.set(item.parent_id, danhSachCon);
        }
    }

    for (const item of sanPham) {
        if (item.category_id) {
            const danhSachSanPham = sanPhamTheoDanhMuc.get(item.category_id) ?? [];
            danhSachSanPham.push(item);
            sanPhamTheoDanhMuc.set(item.category_id, danhSachSanPham);
        }
    }

    for (const item of bienThe) {
        if (item.product_id) {
            const danhSachBienThe = bienTheTheoSanPham.get(item.product_id) ?? [];
            danhSachBienThe.push(item);
            bienTheTheoSanPham.set(item.product_id, danhSachBienThe);
        }
    }

    for (const item of hinhAnh) {
        if (item.product_id) {
            const danhSachHinhAnh = hinhAnhTheoSanPham.get(item.product_id) ?? [];
            danhSachHinhAnh.push(item);
            hinhAnhTheoSanPham.set(item.product_id, danhSachHinhAnh);
        }
    }

    for (const item of lichSuKho) {
        if (item.variant_id) {
            const danhSachLichSu = lichSuTheoBienThe.get(item.variant_id) ?? [];
            danhSachLichSu.push(item);
            lichSuTheoBienThe.set(item.variant_id, danhSachLichSu);
        }
    }

    const sanPhamNamTrongDanhMucCha = danhMuc
        .filter(item => conTheoDanhMucCha.has(item.id))
        .flatMap(danhMucCha =>
            (sanPhamTheoDanhMuc.get(danhMucCha.id) ?? []).map(item => ({
                product_id: item.id,
                product_name: item.name,
                parent_category_id: danhMucCha.id,
                parent_category_name: danhMucCha.name
            }))
        );

    const sanPhamKhongCoBienThe = sanPham
        .filter(item => !bienTheTheoSanPham.has(item.id))
        .map(item => ({
            product_id: item.id,
            product_name: item.name,
            category_id: item.category_id
        }));

    const sanPhamKhongCoHinhAnh = sanPham
        .filter(item => !hinhAnhTheoSanPham.has(item.id))
        .map(item => ({
            product_id: item.id,
            product_name: item.name
        }));

    const sanPhamKhongCoAnhChinh = sanPham
        .filter(item => {
            const danhSachHinh = hinhAnhTheoSanPham.get(item.id) ?? [];
            return danhSachHinh.length > 0 && !danhSachHinh.some(hinh => hinh.is_main === true);
        })
        .map(item => ({
            product_id: item.id,
            product_name: item.name
        }));

    const sanPhamNhieuAnhChinh = sanPham
        .filter(item => {
            const danhSachHinh = hinhAnhTheoSanPham.get(item.id) ?? [];
            return danhSachHinh.filter(hinh => hinh.is_main === true).length > 1;
        })
        .map(item => ({
            product_id: item.id,
            product_name: item.name
        }));

    const bienTheTonKhoKhongHopLe = bienThe
        .filter(item => Number(item.stock_quantity ?? 0) < 0 || Number.isNaN(Number(item.stock_quantity)))
        .map(item => ({
            variant_id: item.id,
            product_id: item.product_id,
            stock_quantity: item.stock_quantity
        }));

    const bienTheGiaVonKhongHopLe = bienThe
        .filter(item => Number(item.cost_price ?? 0) < 0 || Number.isNaN(Number(item.cost_price)))
        .map(item => ({
            variant_id: item.id,
            product_id: item.product_id,
            cost_price: item.cost_price
        }));

    const bienTheKhongCoLichSuNhapKho = bienThe
        .filter(item => Number(item.stock_quantity ?? 0) > 0 && !lichSuTheoBienThe.has(item.id))
        .map(item => ({
            variant_id: item.id,
            product_id: item.product_id,
            stock_quantity: item.stock_quantity,
            cost_price: item.cost_price
        }));

    const tongQuan = {
        soDanhMuc: danhMuc.length,
        soSanPham: sanPham.length,
        soBienThe: bienThe.length,
        soHinhAnh: hinhAnh.length,
        soLichSuKho: lichSuKho.length,
        sanPhamNamTrongDanhMucCha: sanPhamNamTrongDanhMucCha.length,
        sanPhamKhongCoBienThe: sanPhamKhongCoBienThe.length,
        sanPhamKhongCoHinhAnh: sanPhamKhongCoHinhAnh.length,
        sanPhamKhongCoAnhChinh: sanPhamKhongCoAnhChinh.length,
        sanPhamNhieuAnhChinh: sanPhamNhieuAnhChinh.length,
        bienTheTonKhoKhongHopLe: bienTheTonKhoKhongHopLe.length,
        bienTheGiaVonKhongHopLe: bienTheGiaVonKhongHopLe.length,
        bienTheKhongCoLichSuNhapKho: bienTheKhongCoLichSuNhapKho.length
    };

    logThongTin('Tong quan du lieu', tongQuan);
    logThongTin('San pham dang nam trong danh muc cha', sanPhamNamTrongDanhMucCha.slice(0, 20));
    logThongTin('San pham khong co bien the', sanPhamKhongCoBienThe.slice(0, 20));
    logThongTin('San pham khong co hinh anh', sanPhamKhongCoHinhAnh.slice(0, 20));
    logThongTin('San pham khong co anh chinh', sanPhamKhongCoAnhChinh.slice(0, 20));
    logThongTin('San pham co nhieu anh chinh', sanPhamNhieuAnhChinh.slice(0, 20));
    logThongTin('Bien the co ton kho khong hop le', bienTheTonKhoKhongHopLe.slice(0, 20));
    logThongTin('Bien the co gia von khong hop le', bienTheGiaVonKhongHopLe.slice(0, 20));
    logThongTin('Bien the co ton kho nhung chua co lich su', bienTheKhongCoLichSuNhapKho.slice(0, 20));

    if (!laCheDoApDung) {
        console.log('\nDry-run hoan tat. Khong co thay doi nao duoc ghi vao database.');
        return;
    }

    let soDanhMucKhacDaTao = 0;
    let soSanPhamDaChuyenDanhMuc = 0;
    let soBienTheDaTao = 0;
    let soAnhChinhDaSua = 0;
    let soBienTheDaChuanHoaTonKho = 0;
    let soBienTheDaChuanHoaGiaVon = 0;
    let soLogKhoDaTao = 0;

    const danhMucKhacTheoCha = new Map<number, CategoryRow>();

    for (const danhMucCha of danhMuc.filter(item => conTheoDanhMucCha.has(item.id))) {
        const danhSachCon = conTheoDanhMucCha.get(danhMucCha.id) ?? [];
        const danhMucKhacDaCo = danhSachCon.find(item => item.slug === taoSlugKhac(danhMucCha.slug, danhMucCha.id));
        if (danhMucKhacDaCo) {
            danhMucKhacTheoCha.set(danhMucCha.id, danhMucKhacDaCo);
        }
    }

    for (const danhMucCha of danhMuc.filter(item => conTheoDanhMucCha.has(item.id))) {
        const sanPhamCanChuyen = sanPhamTheoDanhMuc.get(danhMucCha.id) ?? [];

        if (sanPhamCanChuyen.length === 0) {
            continue;
        }

        let danhMucKhac = danhMucKhacTheoCha.get(danhMucCha.id);

        if (!danhMucKhac) {
            const duLieuDanhMucMoi = {
                name: `${danhMucCha.name} Khác`,
                description: `Danh mục con mặc định được tạo tự động để đồng bộ sản phẩm của ${danhMucCha.name}`,
                parent_id: danhMucCha.id,
                slug: taoSlugKhac(danhMucCha.slug, danhMucCha.id),
                status: danhMucCha.status ?? 'Active'
            };

            const { data: danhMucMoi, error: loiTaoDanhMuc } = await supabaseClient
                .from('categories')
                .insert([duLieuDanhMucMoi])
                .select('id, name, description, parent_id, slug, status, created_at')
                .single();

            if (loiTaoDanhMuc) {
                throw loiTaoDanhMuc;
            }

            danhMucKhac = danhMucMoi as CategoryRow;
            danhMucKhacTheoCha.set(danhMucCha.id, danhMucKhac);
            soDanhMucKhacDaTao += 1;
        }

        const danhSachSanPhamCanChuyen = sanPhamCanChuyen.map(item => item.id);
        const { error: loiCapNhatSanPham } = await supabaseClient
            .from('products')
            .update({ category_id: danhMucKhac.id })
            .in('id', danhSachSanPhamCanChuyen);

        if (loiCapNhatSanPham) {
            throw loiCapNhatSanPham;
        }

        soSanPhamDaChuyenDanhMuc += danhSachSanPhamCanChuyen.length;
    }

    for (const item of sanPhamKhongCoBienThe) {
        const sanPhamHienTai = sanPham.find(sanPhamItem => sanPhamItem.id === item.product_id);
        if (!sanPhamHienTai) {
            continue;
        }

        const giaBan = Number(sanPhamHienTai.base_price ?? 0);
        const giaVon = giaBan > 0 ? Math.round(giaBan * 0.6) : 0;

        const { error: loiTaoBienThe } = await supabaseClient
            .from('product_variants')
            .insert([
                {
                    product_id: sanPhamHienTai.id,
                    sku: taoSkuMacDinh(sanPhamHienTai.id),
                    size: null,
                    color: null,
                    price: giaBan > 0 ? giaBan : 1,
                    stock_quantity: 0,
                    cost_price: giaVon
                }
            ]);

        if (loiTaoBienThe) {
            throw loiTaoBienThe;
        }

        soBienTheDaTao += 1;
    }

    for (const sanPhamHienTai of sanPham) {
        const danhSachHinh = hinhAnhTheoSanPham.get(sanPhamHienTai.id) ?? [];

        if (danhSachHinh.length === 0) {
            continue;
        }

        const danhSachAnhChinh = danhSachHinh.filter(hinh => hinh.is_main === true);

        if (danhSachAnhChinh.length === 0) {
            const hinhDauTien = danhSachHinh[0];
            if (!hinhDauTien) {
                continue;
            }
            const { error: loiSuaAnhChinh } = await supabaseClient
                .from('product_images')
                .update({ is_main: true })
                .eq('id', hinhDauTien.id);

            if (loiSuaAnhChinh) {
                throw loiSuaAnhChinh;
            }

            soAnhChinhDaSua += 1;
            continue;
        }

        if (danhSachAnhChinh.length > 1) {
            const [anhChinhGiuLai, ...anhChinhCanBo] = danhSachAnhChinh;
            if (!anhChinhGiuLai) {
                continue;
            }

            const { error: loiBoDanhDauAnhPhu } = await supabaseClient
                .from('product_images')
                .update({ is_main: false })
                .in('id', anhChinhCanBo.map(hinh => hinh.id));

            if (loiBoDanhDauAnhPhu) {
                throw loiBoDanhDauAnhPhu;
            }

            const { error: loiGiuAnhChinh } = await supabaseClient
                .from('product_images')
                .update({ is_main: true })
                .eq('id', anhChinhGiuLai.id);

            if (loiGiuAnhChinh) {
                throw loiGiuAnhChinh;
            }

            soAnhChinhDaSua += 1;
        }
    }

    for (const item of bienTheTonKhoKhongHopLe) {
        const { error: loiSuaTonKho } = await supabaseClient
            .from('product_variants')
            .update({ stock_quantity: 0 })
            .eq('id', item.variant_id);

        if (loiSuaTonKho) {
            throw loiSuaTonKho;
        }

        soBienTheDaChuanHoaTonKho += 1;
    }

    for (const item of bienTheGiaVonKhongHopLe) {
        const bienTheHienTai = bienThe.find(bienTheItem => bienTheItem.id === item.variant_id);
        const sanPhamHienTai = bienTheHienTai?.product_id
            ? sanPham.find(sanPhamItem => sanPhamItem.id === bienTheHienTai.product_id)
            : null;

        const giaVonMoi = Math.max(0, Math.round(Number(sanPhamHienTai?.base_price ?? 0) * 0.6));

        const { error: loiSuaGiaVon } = await supabaseClient
            .from('product_variants')
            .update({ cost_price: giaVonMoi })
            .eq('id', item.variant_id);

        if (loiSuaGiaVon) {
            throw loiSuaGiaVon;
        }

        soBienTheDaChuanHoaGiaVon += 1;
    }

    if (bienTheKhongCoLichSuNhapKho.length > 0) {
        const duLieuLogKho = bienTheKhongCoLichSuNhapKho.map(item => ({
            variant_id: item.variant_id,
            action_type: 'IMPORT',
            quantity: Number(item.stock_quantity ?? 0),
            cost_price: Math.max(0, Number(item.cost_price ?? 0))
        }));

        const { error: loiThemLogKho } = await supabaseClient
            .from('inventory_logs')
            .insert(duLieuLogKho);

        if (loiThemLogKho) {
            throw loiThemLogKho;
        }

        soLogKhoDaTao = duLieuLogKho.length;
    }

    logThongTin('Ket qua dong bo', {
        soDanhMucKhacDaTao,
        soSanPhamDaChuyenDanhMuc,
        soBienTheDaTao,
        soAnhChinhDaSua,
        soBienTheDaChuanHoaTonKho,
        soBienTheDaChuanHoaGiaVon,
        soLogKhoDaTao
    });

    console.log('\nDong bo du lieu inventory thanh cong.');
}

dongBo()
    .then(() => {
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error('Dong bo inventory that bai:', error);
        process.exitCode = 1;
    });
