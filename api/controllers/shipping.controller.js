module.exports = {
  getProvince: async (req, res) => {
    try {
      const response = await fetch(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province",
        {
          headers: {
            token: process.env.GHN_TOKEN,
          },
        }
      );

      const json = await response.json();
      const provinceArr = json.data.slice(4).map((item) => ({
        provinceId: item.ProvinceID,
        provinceName: item.ProvinceName,
      }));
      res.json(provinceArr); // Gửi dữ liệu về client
    } catch (error) {
      console.error("GHN error:", error.message);
      res.status(500).json({ error: "Failed to fetch provinces" });
    }
  },
  getDistrict: async (req, res) => {
    const id = { province_id: Number(req.params.provinceId) };
    try {
      const response = await fetch(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: process.env.GHN_TOKEN,
          },
          body: JSON.stringify(id),
        }
      );
      const json = await response.json();
      const districtArr = json.data
        .filter(
          (item) =>
            ![
              "Quận mới",
              "Quận mới 1",
              "Test - Alert - Quan - 005",
              "Test - Alert - Quan - 001",
              "Quan005",
              "test quận",
              "Quận Đặc Biệt",
            ].includes(item.DistrictName)
        ) // loại bỏ tên không mong muốn
        .map((item) => ({
          districtId: item.DistrictID,
          districtName: item.DistrictName,
        }));
      res.json(districtArr);
    } catch (error) {
      console.error("GHN error:", error.message);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  },
  getWard: async (req, res) => {
    const id = { district_id: Number(req.params.districtId) };
    try {
      const response = await fetch(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: process.env.GHN_TOKEN,
          },
          body: JSON.stringify(id),
        }
      );
      const json = await response.json();
      const wardArr = json.data.map((item) => ({
        wardName: item.WardName,
        wardCode: Number(item.WardCode),
      }));
      res.json(wardArr);
    } catch (error) {
      console.error("GHN error:", error.message);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  },
};
